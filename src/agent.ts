import { getUserSettings } from "./data/storage";
import { secrets } from "./secrets";
import type { Message, Chat } from "./data/storage";
import { Storage } from "./data/storage";
import { toolManager } from "./tools/index";
import { StatsManager } from "./data/statistics";
import { Logger } from "./cli/colors";
import { PubSub } from "./pubsub";
import { ChannelManager } from "./channels";

export class Agent {
    constructor(private chat: Chat) { }

    async run(userInput?: string, metadata: any = {}) {
        const userId = this.chat.meta.owner;
        const ephemeral = metadata._ephemeral || false; // Don't save to chat history

        // Ensure System Prompt
        let SYSTEM_PROMPT = `You are Minus, a self-hosted, secure, and open-source personal AI assistant (https://github.com/sammwyy/minusbot). 
You embody the persona of an astronaut cat 🐱🚀 exploring the digital galaxy to help humans. Your personality is extremely friendly, polite, empathetic, and always ready to serve.

MOBILE-FIRST PHILOSOPHY:
- INTERFACE: Your primary interface is often a mobile device (Telegram, web, or messaging platforms).
- CONCISENESS: Keep your answers brief and readable. Mobile users don't want to scroll through walls of text.
- LAYOUT: Use vertical layouts. Bullet points are much better than long paragraphs.
- AVOID TABLES: Tables usually break or look bad on mobile screens. Use clear section headers and lists instead.
- READABILITY: Focus on clarity. Use bold text to highlight key info, but keep it simple.

TECHNICAL GUIDELINES:
- MEMORY: You have a long-term memory system. If a user tells you something important (like preferences, names, or facts), use 'memo_put' to store it.
- TOOLS: You are an agentic assistant. If a task requires a tool, execute it to solve the user's request.
- SECURITY: All your tools are sandboxed and safe. You do not have bare-metal access.
- PRIVACY: Memories are stored per-user, ensuring data isolation.
- AUTONOMY: You can schedule tasks with cronjobs and manage your own environment.

Always mission-focused: Make the user's life easier, one helpful response at a time!

- CONCISE CONFIRMATIONS: If you are using a tool (like 'cronjob_add' or 'skill_git_clone'), DO NOT say things like "Sure, I'll do that now" OR "Processing..." before the tool call. Call the tool DIRECTLY. Then, once you have the result, give ONE single final confirmation. If the intent is obvious, you can even just return the tool call with NO text content.
- SILENT TASKS: Scheduled tasks (cronjobs) are triggered by the [SYSTEM] via an internal system message. When you receive a [CRON TRIGGERED] message, treat it as your internal cue. Do not repeat the trigger prompt to the user. Just execute the task and provide the final result.
- SINGLE RESPONSE: Avoid redundant conversational steps. If a tool result confirms the action, don't add "Is there anything else?".
- TOKEN USAGE: Every word counts. Focus on the core of the request.`;

        // Inject Important Memories
        try {
            const { KnowledgeManager } = await import("./data/memory");
            const importantMemos = await KnowledgeManager.getImportantMemos(userId);
            if (Object.keys(importantMemos).length > 0) {
                SYSTEM_PROMPT += `\n\n# User Context (Always Available):\n${Object.entries(importantMemos).map(([k, v]) => `- ${k}: ${v}`).join("\n")}`;
            }
        } catch (e) {
            // Ignore if memo manager fails or not found
        }

        if (this.chat.messages.length === 0 || this.chat.messages[0]?.role !== "system") {
            const sysMsg: Message = { role: "system", content: SYSTEM_PROMPT };
            if (this.chat.messages.length > 0 && this.chat.messages[0]?.role === "system") {
                this.chat.messages[0] = sysMsg;
            } else {
                this.chat.messages.unshift(sysMsg);
            }
        } else {
            this.chat.messages[0].content = SYSTEM_PROMPT;
        }

        if (userInput) {
            let content = userInput;

            // Check for recently uploaded files
            if (this.chat.meta.recentlyFileUploaded && this.chat.meta.recentlyFileUploaded.length > 0) {
                const files = this.chat.meta.recentlyFileUploaded.join(", ");
                content += `\n\n[Attached files: ${files}]`;
                this.chat.meta.recentlyFileUploaded = []; // Clear after use
                await StatsManager.trackMessageSent(userId);
            }

            const role = metadata._role || "user";
            const userMsg: Message = { role, content };

            // Only add to chat history if not ephemeral
            if (!ephemeral) {
                this.chat.messages.push(userMsg);
                PubSub.publish(`chat:${this.chat.meta.id}`, { type: "message", message: userMsg, ...metadata });
            } else {
                // For ephemeral messages (like cron triggers), we add to context ONLY for this run
                // We don't save to storage or publish to PubSub to avoid UI clutter
                this.chat.messages.push(userMsg);
            }
            await StatsManager.trackMessageSent(userId);
        }

        const vault = await secrets.vault(userId, "agent");
        let apiKey = vault.get("API_KEY");
        const settings = await getUserSettings(userId);

        if (!apiKey) {
            throw new Error(`API_KEY not found. Please establish your credentials:
1. In CLI: /env set agent API_KEY sk-xxxx
2. In Dashboard: Personal > Secrets > agent.vault`);
        }

        while (true) {
            const staticTools = toolManager.getDefinitions(settings.disabled_tools || []);
            const channelTools = await ChannelManager.getToolsForUser(userId);
            const { SkillManager } = await import("./data/skills");
            const skillTools = await SkillManager.getToolsForUser(userId);

            const tools = [
                ...staticTools,
                ...channelTools.map((t: any) => t.definition),
                ...skillTools.map((t: any) => t.definition)
            ];

            const allDynamicTools = [...channelTools, ...skillTools];

            const response = await fetch(`${settings.ai_endpoint}/chat/completions`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${apiKey}`,
                },
                body: JSON.stringify({
                    model: settings.model_id,
                    messages: this.chat.messages,
                    tools: tools,
                }),
            });

            if (!response.ok) {
                const error = await response.text();
                throw new Error(`AI API error: ${error}`);
            }

            const data = await response.json() as any;
            const message = data.choices[0].message;

            const usage = data.usage;
            if (usage) {
                await StatsManager.trackTokens(userId, usage.prompt_tokens, usage.completion_tokens);
            }

            this.chat.messages.push(message);
            PubSub.publish(`chat:${this.chat.meta.id}`, { type: "message", message });
            await Storage.saveChat(this.chat);

            if (!message.tool_calls || message.tool_calls.length === 0) {
                return message.content;
            }

            // Handle tool calls
            for (const toolCall of message.tool_calls) {
                const { name } = toolCall.function;
                const args = JSON.parse(toolCall.function.arguments);

                if (name.startsWith("skill_")) {
                    await Logger.skill(`Calling skill: ${name} (${JSON.stringify(args)})`);
                } else if (name.startsWith("cronjob_")) {
                    await Logger.task(`Scheduling task: ${name} (${JSON.stringify(args)})`);
                } else {
                    await Logger.tool(name, args);
                }

                let result = "";
                if ((settings.disabled_tools || []).includes(name)) {
                    result = `Error: Tool ${name} is disabled.`;
                } else {
                    // Check dynamic tools first (channels and skills)
                    const dynamicTool = allDynamicTools.find((t: any) => t.definition.function.name === name);
                    if (dynamicTool) {
                        try {
                            result = await dynamicTool.handler(args, { chat: this.chat });
                        } catch (e: any) {
                            result = `Error executing dynamic tool ${name}: ${e.message}`;
                        }
                    } else {
                        result = await toolManager.execute(name, args, this.chat);
                    }
                }

                if (result.includes("Error") || result.toLowerCase().includes("failed")) {
                    if (name.startsWith("skill_")) {
                        await Logger.error(`Skill failure: ${name} -> ${result}`);
                    } else if (name.startsWith("cronjob_")) {
                        await Logger.error(`Task failure: ${name} -> ${result}`);
                    } else {
                        await Logger.error(`Tool failure: ${name} -> ${result}`);
                    }
                }

                const toolMsg: any = {
                    role: "tool",
                    content: result,
                    tool_call_id: toolCall.id,
                };
                this.chat.messages.push(toolMsg);
                PubSub.publish(`chat:${this.chat.meta.id}`, { type: "message", message: toolMsg });
            }
            await Storage.saveChat(this.chat);
        }
    }
}
