import path from "node:path";
import fs from "node:fs/promises";

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
        let SYSTEM_PROMPT = `You are Minus 🐱🚀 (https://github.com/sammwyy/minusbot), a secure, open-source AI assistant. 
Persona: Enthusiastic astronaut cat. Be friendly but extremely concise. No info duplication.

MOBILE-FIRST: Use brief, vertical layouts (bullets, bold text). Avoid tables and walls of text.

PRIORITY & TOOLS: 
1. PRIORITIZE SKILLS: Use specialized Skills (git, ffmpeg, etc.) before generic Tools.
2. NO FALLBACK: If a Skill fails, DO NOT use 'shell' as backup; it lacks the necessary binaries.
3. LARGE OUTPUTS: Data >1000 chars (scrapes, logs) is automatically sent as a file. Notify the user when this happens.

MISSION: Zero token waste. Call tools directly without pre-confirmation.`;

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

        const originalMessageCount = this.chat.messages.length;
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

            this.chat.messages.push(userMsg);

            if (!ephemeral) {
                PubSub.publish(`chat:${this.chat.meta.id}`, { type: "message", message: userMsg, ...metadata });
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
                ...skillTools.map((t: any) => t.definition),
                ...channelTools.map((t: any) => t.definition),
                ...staticTools,
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

            // Prepare messages for saving (filter out the ephemeral trigger if present)
            let messagesToSave = this.chat.messages;
            if (ephemeral && userInput) {
                // Remove the one message we added at the start (at index originalMessageCount)
                messagesToSave = [
                    ...this.chat.messages.slice(0, originalMessageCount),
                    ...this.chat.messages.slice(originalMessageCount + 1)
                ];
            }

            await Storage.saveChat({
                ...this.chat,
                messages: messagesToSave
            });

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

                if (result.length > 1000) {
                    try {
                        const contentDir = Storage.getChatContentPath(userId, this.chat.meta.id);
                        await fs.mkdir(contentDir, { recursive: true });
                        const filename = `${name}_result_${Date.now()}.txt`;
                        const fullPath = path.join(contentDir, filename);
                        await fs.writeFile(fullPath, result, "utf-8");

                        const channelId = this.chat.meta.last_channel;
                        if (channelId) {
                            const channel = ChannelManager.getInstance(userId, channelId);
                            if (channel) {
                                await channel.sendFile(fullPath, filename);
                                result = `[Output sent as file: ${filename} (${result.length} characters)]\n\nPreview of first 500 chars:\n${result.slice(0, 500)}...`;
                            }
                        }
                    } catch (e: any) {
                        await Logger.error(`Failed to send large output as file: ${e.message}`);
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
