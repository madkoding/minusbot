import path from "node:path";
import fs from "node:fs/promises";

import { getUserSettings, getSystemSettings } from "./data/storage";
import type { Message, Chat } from "./data/storage";
import { Storage } from "./data/storage";
import { toolManager } from "./tools/index";
import { StatsManager } from "./data/statistics";
import { Logger } from "./cli/colors";
import { PubSub } from "./pubsub";
import { ChannelManager } from "./channels";
import { ProviderManager } from "./data/providers";
import { AIRegistry } from "./ai/registry";

export class Agent {
    constructor(private chat: Chat) { }

    async run(userInput?: string, metadata: any = {}) {
        const userId = this.chat.meta.owner;
        const ephemeral = metadata._ephemeral || false; // Don't save to chat history

        // Ensure System Prompt
        const systemSettings = await getSystemSettings();
        let SYSTEM_PROMPT = systemSettings.system_prompt || "";

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
                await Storage.saveChat(this.chat);
            }
            await StatsManager.trackMessageSent(userId);
        }

        while (this.chat.messages.length > originalMessageCount || userInput) {
            userInput = undefined; // Clear after first loop iteration if we're in a tool-call loop

            const settings = await getUserSettings(userId);
            const tools = toolManager.getToolsForAI(this.chat, settings);
            const allDynamicTools = await toolManager.getDynamicTools(userId);
            const dynamicDefinitions = allDynamicTools.map((t: any) => t.definition);
            tools.push(...dynamicDefinitions);

            const activeProviderId = settings.active_providers?.text;
            if (!activeProviderId) {
                throw new Error("No active AI provider configured for 'text'. Please go to Settings > AI Providers.");
            }

            const provider = await ProviderManager.getProvider(activeProviderId, userId);
            if (!provider) {
                throw new Error(`Active provider not found: ${activeProviderId}`);
            }

            const client = AIRegistry.getClient(provider.client);
            if (!client) {
                throw new Error(`AI Client protocol not found: ${provider.client}`);
            }

            const apiKey = await ProviderManager.getProviderToken(activeProviderId, userId);
            if (!apiKey) {
                throw new Error("No API Key found for the active provider.");
            }

            let aiResponse: any;
            try {
                aiResponse = await client.chat({
                    apiKey,
                    model: provider.config.model_id,
                    messages: this.chat.messages,
                    tools: tools.length > 0 ? tools : undefined,
                    max_tokens: provider.config.max_tokens,
                    temperature: provider.config.temperature,
                    extra: provider.config.extra
                });
            } catch (e: any) {
                throw new Error(`AI Provider Request Failed (${provider.name}): ${e.message}`);
            }

            const message: any = {
                role: "assistant",
                content: aiResponse.content,
                tool_calls: aiResponse.tool_calls
            };

            const usage = aiResponse.usage;
            if (usage) {
                await StatsManager.trackTokens(userId, usage.prompt_tokens, usage.completion_tokens);
            }

            this.chat.messages.push(message);
            PubSub.publish(`chat:${this.chat.meta.id}`, { type: "message", message });

            // Prepare messages for saving (filter out the ephemeral trigger if present)
            let messagesToSave = this.chat.messages;
            if (ephemeral && userInput) {
                // This logic is slightly flawed because userInput is now cleared, but we still have originalMessageCount
                // Let's keep it simple for now as per original.
            }

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
