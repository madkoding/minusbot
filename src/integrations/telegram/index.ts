import { Context, Telegraf } from "telegraf";
import type { Update } from "telegraf/types";

import { Integration } from "../base";
import type { IntegrationSchema } from "../base";
import { Logger } from "../../cli/colors";
import { PubSub } from "../../pubsub";
import { InputProcessor } from "../../processor";
import { Storage } from "../../storage";
import { uploadFileToChat } from "../../uploads";
import { commandManager } from "../../commands";

const activeBots = new Map<string, { bot: Telegraf<Context<Update>>, users: Set<string> }>();

export class TelegramIntegration extends Integration {
    static readonly ID = "telegram";

    readonly id = TelegramIntegration.ID;
    readonly name = "Telegram Bot";
    readonly description = "Sync a specific Minusbot chat with a Telegram user.";

    readonly schema: IntegrationSchema = {
        id: this.id,
        name: this.name,
        description: this.description,
        fields: [
            { id: "chat_id", label: "Minusbot Chat ID", type: "string", description: "The internal Chat ID to sync (e.g. main)." },
            { id: "user_id", label: "Telegram User ID", type: "string", description: "The Telegram User ID to bridge." }
        ],
        vaultKeys: ["BOT_TOKEN"]
    };

    private botToken?: string;
    private isRunning = false;
    private pubsubListener?: (data: any) => void;

    async start() {
        const vault = await this.getVault(this.user.id);
        this.botToken = vault.get("BOT_TOKEN");

        if (!this.botToken || this.botToken === "") {
            await Logger.warn(`Telegram integration for ${this.user.username} missing BOT_TOKEN.`);
            return;
        }

        const internalChatId = this.config.chat_id;
        const tgUserId = this.config.user_id;

        if (!internalChatId || !tgUserId) {
            await Logger.warn(`Telegram integration for ${this.user.username} missing configuration (chat_id or user_id).`);
            return;
        }

        this.isRunning = true;

        let shared = activeBots.get(this.botToken);
        if (!shared) {
            try {
                const bot = new Telegraf(this.botToken);
                shared = { bot, users: new Set() };
                activeBots.set(this.botToken, shared);

                // Disable handleSignals for Bun compatibility
                bot.launch({
                    dropPendingUpdates: true,
                    handleSignals: false
                } as any).catch(async (e: any) => {
                    await Logger.error(`Telegram launch failed: ${e.message}`);
                    activeBots.delete(this.botToken!);
                });
            } catch (e: any) {
                await Logger.error(`Telegram initialization failed: ${e.message}`);
                return;
            }
        }

        shared.users.add(this.user.id);

        // Register Telegram -> Minusbot logic
        await this.registerTelegramHandler(shared.bot);

        // Register Minusbot -> Telegram logic (PubSub)
        this.registerPubSubHandler();

        await Logger.info(`Telegram integration sync for chat '${internalChatId}' (User: ${this.user.username})`);
    }

    private async registerTelegramHandler(bot: Telegraf) {
        const internalChatId = this.config.chat_id;
        const tgUserId = this.config.user_id;

        // Register Commands
        const commands = commandManager.getCommands();
        try {
            await bot.telegram.setMyCommands(commands.map(c => ({
                command: c.name,
                description: c.description
            })));
        } catch (e: any) {
            await Logger.warn(`Failed to set Telegram commands: ${e.message}`);
        }

        for (const cmd of commands) {
            bot.command(cmd.name, async (ctx, next) => {
                const senderId = ctx.from?.id.toString();
                if (senderId !== tgUserId.toString()) return next();

                try {
                    const text = ctx.message.text;
                    await InputProcessor.process(text, this.user.id, internalChatId, { _internal_source_tg: true });
                } catch (e: any) {
                    await ctx.reply(`Error: ${e.message}`, { parse_mode: "MarkdownV2" });
                }
            });
        }

        bot.on("message", async (ctx, next) => {
            if (!this.isRunning) return next();

            const senderId = ctx.from?.id.toString();
            if (senderId !== tgUserId.toString()) {
                await Logger.warn(`Telegram integration for ${this.user.username} received message from unknown user id: ${senderId}.`);
                return next();
            }

            const msg: any = ctx.message;
            const text = msg.text || msg.caption || "";

            // Check for files
            const files: { id: string, name: string, url: string }[] = [];

            // Photos (get largest)
            if (msg.photo && msg.photo.length > 0) {
                const photo = msg.photo[msg.photo.length - 1];
                const fileLink = await ctx.telegram.getFileLink(photo.file_id);
                // Telegram file links don't always have extensions in last segment, but href usually ends with it.
                // Or we can guess it.
                const filename = `photo_${Date.now()}.jpg`;
                files.push({ id: photo.file_id, name: filename, url: fileLink.href });
            }

            // Documents
            if (msg.document) {
                const fileLink = await ctx.telegram.getFileLink(msg.document.file_id);
                files.push({ id: msg.document.file_id, name: msg.document.file_name || `doc_${Date.now()}`, url: fileLink.href });
            }

            // Audio
            if (msg.audio) {
                const fileLink = await ctx.telegram.getFileLink(msg.audio.file_id);
                files.push({ id: msg.audio.file_id, name: msg.audio.file_name || `audio_${Date.now()}.mp3`, url: fileLink.href });
            }

            // Voice
            if (msg.voice) {
                const fileLink = await ctx.telegram.getFileLink(msg.voice.file_id);
                files.push({ id: msg.voice.file_id, name: `voice_${Date.now()}.ogg`, url: fileLink.href });
            }

            // Video
            if (msg.video) {
                const fileLink = await ctx.telegram.getFileLink(msg.video.file_id);
                files.push({ id: msg.video.file_id, name: msg.video.file_name || `video_${Date.now()}.mp4`, url: fileLink.href });
            }

            // If no text and no files, ignore
            if (!text && files.length === 0) return next();

            try {
                const uploadedNames: string[] = [];

                if (files.length > 0) {
                    // Ensure chat exists
                    let chat = await Storage.getChat(this.user.id, internalChatId);
                    if (!chat) {
                        chat = {
                            meta: {
                                id: internalChatId,
                                type: "permanent",
                                last_activity: new Date().toISOString(),
                                message_count: 0,
                                owner: this.user.id
                            },
                            messages: []
                        };
                        await Storage.saveChat(chat);
                    }

                    // Process uploads
                    await ctx.replyWithChatAction("upload_document");
                    for (const file of files) {
                        try {
                            await uploadFileToChat(chat, (file as any).url, (file as any).name);
                            uploadedNames.push((file as any).name);
                        } catch (e: any) {
                            await Logger.error(`Failed to upload telegram file ${file.name}: ${e.message}`);
                        }
                    }
                }

                const processText = text || (uploadedNames.length > 0 ? "Shared a file." : "");

                await InputProcessor.process(processText, this.user.id, internalChatId, {
                    _internal_source_tg: true,
                    _attachments: uploadedNames
                });
            } catch (e: any) {
                await ctx.reply(`Error: ${e.message}`, { parse_mode: "MarkdownV2" });
            }
        });
    }

    private normalizeTGMessage(text: string): string {
        // Strip headers
        let clean = text.replace(/^#+\s*/gm, "");

        // Escape reserved characters for MarkdownV2 that are common in normal text
        clean = clean.replace(/([\.!\-\+\=\|\{\}\#\>~])/g, "\\$1");

        // Convert Markdown Bold (**text**) to Telegram Markdown (*text*)
        clean = clean.replace(/\*\*(.*?)\*\*/g, "*$1*");

        // Convert Markdown Italic (__text__) to Telegram Markdown (_text_)
        clean = clean.replace(/__(.*?)__/g, "_$1_");

        return clean;
    }

    private registerPubSubHandler() {
        const internalChatId = this.config.chat_id;
        const tgUserId = this.config.user_id;

        this.pubsubListener = async (data: any) => {
            if (!this.isRunning) return;
            if (data.type !== "message") return;

            const message = data.message;
            if (!message.content) return;

            const shared = activeBots.get(this.botToken!);
            if (!shared) {
                await Logger.warn("[Telegram] Shared bot instance not found for PubSub event.");
                return;
            }

            if (message.role === "tool") {
                try {
                    const toolOutput = `🔧 Tool Output: \n\`\`\`\n${message.content.substring(0, 500)}\`\`\`${message.content.length > 500 ? "..." : ""}`;
                    await shared.bot.telegram.sendMessage(tgUserId, this.normalizeTGMessage(toolOutput), { parse_mode: "Markdown" });
                } catch (e: any) {
                    await Logger.error(`Telegram tool output error: ${e.message}`);
                }
                return;
            }

            // Handle Assistant messages (text or tool calls)
            if (message.role === "assistant" || (message.role === "user" && !data._internal_source_tg)) {
                try {
                    // 1. Tool Calls Notification
                    if (message.tool_calls && message.tool_calls.length > 0) {
                        for (const tool of message.tool_calls) {
                            shared.bot.telegram.sendMessage(this.config.user_id, this.normalizeTGMessage(`🛠️ Calling tool: *${tool.function.name}*`), { parse_mode: "Markdown" });
                        }
                    }

                    // 2. Text Content
                    if (message.content) {
                        await Logger.info(`[Telegram] Forwarding message to ${tgUserId}: ${message.content.substring(0, 20)}...`);
                        try {
                            await shared.bot.telegram.sendMessage(tgUserId, this.normalizeTGMessage(message.content), { parse_mode: "MarkdownV2" });
                        } catch (e: any) {
                            await Logger.error(`Telegram send error: ${e.message}`);
                            await shared.bot.telegram.sendMessage(tgUserId, message.content);
                        }
                    }
                } catch (e: any) {
                    await Logger.error(`Telegram send error: ${e.message}`);
                }
            }
        };

        PubSub.subscribe(`chat:${internalChatId}`, this.pubsubListener);
    }

    async stop() {
        this.isRunning = false;

        if (this.pubsubListener) {
            PubSub.unsubscribe(`chat:${this.config.chat_id}`, this.pubsubListener);
        }

        if (this.botToken) {
            const shared = activeBots.get(this.botToken);
            if (shared) {
                shared.users.delete(this.user.id);
                if (shared.users.size === 0) {
                    shared.bot.stop();
                    activeBots.delete(this.botToken);
                }
            }
        }
    }
}
