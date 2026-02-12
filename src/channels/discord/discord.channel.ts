import path from "node:path";
import { Client, GatewayIntentBits, Partials, TextChannel } from "discord.js";

import { Channel } from "../channel-base";
import type { ChannelSchema } from "../channel-base";
import { Logger } from "@/cli/colors";
import { PubSub } from "@/pubsub";
import { InputProcessor } from "@/processor";
import { Storage, uploadFileToChat, getUserSettings } from "@/data/storage";
import { commandManager } from "@/commands";

const activeBots = new Map<string, { client: Client, users: Set<string> }>();

export class DiscordChannel extends Channel {
    static readonly ID = "discord";

    readonly id = DiscordChannel.ID;
    readonly name = "Discord Bot";
    readonly description = "Sync a specific Minusbot chat with a Discord text channel.";
    readonly icon = "🎮";

    readonly schema: ChannelSchema = {
        id: this.id,
        name: this.name,
        description: this.description,
        icon: this.icon,
        fields: [
            {
                id: "chat_id",
                label: "Minusbot Chat ID",
                type: "string",
                description: "The internal Chat ID to sync (e.g. main).",
                secret: false
            },
            {
                id: "channel_id", // Mapped from user_id in Telegram
                label: "Discord Channel ID",
                type: "string",
                description: "The Discord Text Channel ID to bridge.",
                secret: false
            },
            {
                id: "BOT_TOKEN",
                label: "Bot Token",
                type: "string",
                description: "The Discord Bot Token.",
                secret: true
            }
        ],
        vaultKeys: ["BOT_TOKEN"]
    };

    private botToken?: string;
    private isRunning = false;
    private pubsubListener?: (data: any) => void;

    async start() {
        const secrets = await this.getSecrets();
        this.botToken = secrets.BOT_TOKEN;

        if (!this.botToken || this.botToken === "") {
            await Logger.warn(`Discord channel for ${this.user.username} missing BOT_TOKEN.`);
            return;
        }

        const internalChatId = this.config.settings.chat_id;
        const channelId = this.config.settings.channel_id;

        if (!internalChatId || !channelId) {
            await Logger.warn(`Discord channel for ${this.user.username} missing configuration (chat_id or channel_id).`);
            return;
        }

        this.isRunning = true;

        let shared = activeBots.get(this.botToken);
        if (!shared) {
            try {
                const client = new Client({
                    intents: [
                        GatewayIntentBits.Guilds,
                        GatewayIntentBits.GuildMessages,
                        GatewayIntentBits.MessageContent,
                        GatewayIntentBits.DirectMessages,
                        GatewayIntentBits.DirectMessageReactions,
                        GatewayIntentBits.DirectMessageTyping
                    ],
                    partials: [Partials.Channel]
                });

                shared = { client, users: new Set() };
                activeBots.set(this.botToken, shared);

                client.on("clientReady", () => {
                    Logger.info(`Discord bot logged in as ${client.user?.tag}`);
                });

                await client.login(this.botToken);

            } catch (e: any) {
                await Logger.error(`Discord initialization failed: ${e.message}`);
                return;
            }
        }

        shared.users.add(this.user.id);

        // Register Discord -> Minusbot logic
        await this.registerDiscordHandler(shared.client);

        // Register Minusbot -> Discord logic (PubSub)
        this.registerPubSubHandler();

        await Logger.info(`Discord channel sync for chat '${internalChatId}' (User: ${this.user.username}, Channel: ${channelId})`);
    }

    async stop() {
        this.isRunning = false;

        if (this.pubsubListener) {
            PubSub.unsubscribe(`chat:${this.config.settings.chat_id}`, this.pubsubListener);
        }

        if (this.botToken) {
            const shared = activeBots.get(this.botToken);
            if (shared) {
                shared.users.delete(this.user.id);
                if (shared.users.size === 0) {
                    shared.client.destroy();
                    activeBots.delete(this.botToken);
                }
            }
        }
    }

    async sendFile(filePath: string, filename?: string) {
        const shared = activeBots.get(this.botToken!);
        if (!shared) throw new Error("Discord bot not initialized");

        const channelId = this.config.settings.channel_id;
        try {
            const channel = await shared.client.channels.fetch(channelId);
            if (channel instanceof TextChannel) {
                await channel.send({
                    files: [{
                        attachment: filePath,
                        name: filename || path.basename(filePath)
                    }]
                });
            } else {
                throw new Error("Discord channel is not a text channel");
            }
        } catch (e: any) {
            throw new Error(`Failed to send file to Discord: ${e.message}`);
        }
    }

    private async registerDiscordHandler(client: Client) {
        const internalChatId = this.config.settings.chat_id;
        const channelId = this.config.settings.channel_id;

        // Register Slash Commands
        try {
            const commands = commandManager.getDiscordCommands();

            if (client.application) {
                await client.application.commands.set(commands);
                Logger.info(`Registered ${commands.length} slash commands for Discord (with subcommands).`);
            }
        } catch (e: any) {
            await Logger.warn(`Failed to match Discord commands: ${e.message}`);
        }

        // Handle Slash Commands (Interactions)
        client.on("interactionCreate", async (interaction) => {
            if (!interaction.isChatInputCommand()) return;
            if (!this.isRunning) return;

            const commandName = interaction.commandName;

            // Correctly extract options. Discord.js v14+ interactions have different structures depending on command type.
            const extractArgs = (options: readonly any[]): string[] => {
                let args: string[] = [];
                for (const opt of options) {
                    if (opt.type === 1) { // Subcommand
                        args.push(opt.name);
                        if (opt.options) {
                            args.push(...extractArgs(opt.options));
                        }
                    } else if (opt.value !== undefined) {
                        args.push(opt.value.toString());
                    }
                }
                return args;
            };

            const args = extractArgs(interaction.options.data);
            const simulatedInput = `/${commandName} ${args.join(" ")}`;

            // Defer reply since processing might take time
            try {
                await interaction.deferReply();
            } catch (e) {
                return;
            }

            try {
                await InputProcessor.process(simulatedInput, this.user.id, internalChatId, {
                    _internal_source_discord: true,
                    _channel: this.id
                });

                await interaction.editReply({ content: `✅ Command executed: \`${simulatedInput}\`` });
            } catch (e: any) {
                await interaction.editReply({ content: `❌ Error: ${e.message}` });
            }
        });

        // Handle Text Messages
        client.on("messageCreate", async (message) => {
            if (!this.isRunning) return;
            if (message.author.bot) return; // Ignore bots
            if (message.channelId !== channelId) return; // Wrong channel

            const text = message.content;
            const attachments = message.attachments;

            // Check for files
            const uploadedNames: string[] = [];

            if (attachments.size > 0) {
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
                for (const [key, attachment] of attachments) {
                    try {
                        const filename = attachment.name || `file_${Date.now()}`;
                        await uploadFileToChat(chat, attachment.url, filename);
                        uploadedNames.push(filename);
                    } catch (e: any) {
                        await Logger.error(`Failed to upload discord file ${attachment.name}: ${e.message}`);
                    }
                }
            }

            let processText = text || "";
            if (uploadedNames.length > 0) {
                processText += this.formatUploadNotification(uploadedNames);
            }

            if (!processText.trim()) return;

            // Typing Indicator
            await message.channel.sendTyping();
            const typingInterval = setInterval(() => {
                message.channel.sendTyping().catch(() => { });
            }, 5000);

            try {
                await InputProcessor.process(processText, this.user.id, internalChatId, {
                    _internal_source_discord: true,
                    _attachments: uploadedNames,
                    _channel: this.id
                });
            } catch (e: any) {
                await message.reply(`Error: ${e.message}`);
            } finally {
                clearInterval(typingInterval);
            }
        });
    }

    private registerPubSubHandler() {
        const internalChatId = this.config.settings.chat_id;
        const channelId = this.config.settings.channel_id;

        this.pubsubListener = async (data: any) => {
            if (!this.isRunning) return;
            if (data.type !== "message") return;

            const message = data.message;
            if (!message.content) return;

            const shared = activeBots.get(this.botToken!);
            if (!shared) {
                await Logger.warn("[Discord] Shared bot instance not found for PubSub event.");
                return;
            }

            const settings = await getUserSettings(this.user.id);

            // Helper to send message safely
            const sendToDiscord = async (content: string) => {
                try {
                    const channel = await shared?.client.channels.fetch(channelId);
                    if (channel && (channel.isTextBased())) {
                        // Discord has a 2000 char limit
                        if (content.length > 2000) {
                            const chunks = content.match(/[\s\S]{1,2000}/g) || [];
                            for (const chunk of chunks) {
                                await (channel as any).send(chunk);
                            }
                        } else {
                            await (channel as any).send(content);
                        }
                    }
                } catch (e: any) {
                    await Logger.error(`Discord send error: ${e.message}`);
                }
            }

            if (message.role === "tool") {
                if (!settings.debug) return;
                const toolOutput = `🔧 **Tool Output**:\n\`\`\`\n${message.content.substring(0, 1900)}\`\`\``;
                await sendToDiscord(toolOutput);
                return;
            }

            // Handle Assistant messages (text or tool calls)
            if (message.role === "assistant" || (message.role === "user" && !data._internal_source_discord)) {

                // 1. Tool Calls Notification
                if (settings.debug && message.tool_calls && message.tool_calls.length > 0) {
                    for (const tool of message.tool_calls) {
                        await sendToDiscord(`🛠️ Calling tool: **${tool.function.name}**`);
                    }
                }

                // 2. Text Content
                if (message.content) {
                    await Logger.info(`[Discord] Forwarding message to ${channelId}: ${message.content.substring(0, 20)}...`);
                    await sendToDiscord(message.content);
                }
            }
        };

        PubSub.subscribe(`chat:${internalChatId}`, this.pubsubListener);
    }
}
