import fs from "node:fs/promises";
import { UserManager } from "../data/users";
import type { User } from "../data/users";
import { Channel, type ChannelConfig } from "./channel-base";
import { TelegramChannel } from "./telegram/telegram.channel";
import { DiscordChannel } from "./discord/discord.channel";
import { WebChannel } from "./web/web.channel";
import { getUserChannelsDir, getUserChannelConfigFile } from "../data/storage";
import { Logger } from "../cli/colors";

export class ChannelManager {
    private static userInstances: Map<string, Map<string, Channel>> = new Map();

    static readonly AVAILABLE_CHANNELS: any = [
        TelegramChannel,
        DiscordChannel,
        WebChannel
    ];

    static async init() {
        const users = UserManager.getUsers();
        for (const user of users) {
            await this.loadForUser(user).catch(async e => {
                await Logger.error(`Failed to init channels for ${user.username}: ${e.message}`);
            });
        }
    }

    static async loadForUser(user: User) {
        const userDir = getUserChannelsDir(user.id);

        try {
            await fs.mkdir(userDir, { recursive: true });
        } catch (e) {
            // Ignoring mkdir error if exists
        }

        const userChannels = new Map<string, Channel>();

        for (const ChannelClass of this.AVAILABLE_CHANNELS) {
            const channelId = (ChannelClass as any).ID || "unknown";

            // Web channel is always active and doesn't need external config files
            if (channelId === "web") {
                const instance = new ChannelClass(user, { enabled: true, settings: {}, secrets: {} });
                await instance.start();
                userChannels.set(channelId, instance);
                continue;
            }

            const configPath = getUserChannelConfigFile(user.id, channelId);
            let config: ChannelConfig = {
                enabled: false,
                settings: {},
                secrets: {}
            };

            try {
                const content = await fs.readFile(configPath, "utf-8");
                const parsed = JSON.parse(content);
                config = {
                    enabled: parsed.enabled ?? false,
                    settings: parsed.settings ?? {},
                    secrets: parsed.secrets ?? {}
                };
            } catch {
                // Channel not configured yet
                continue;
            }

            // Only start if enabled
            if (!config.enabled) {
                continue;
            }

            try {
                const instance = new ChannelClass(user, config);
                await instance.start();
                userChannels.set(channelId, instance);
                await Logger.info(`Channel ${channelId} started for user ${user.username}`);
            } catch (e: any) {
                await Logger.error(`Channel ${channelId} failed to start for ${user.username}: ${e.message}`);
            }
        }

        this.userInstances.set(user.id, userChannels);
    }

    static async stopAll() {
        for (const [userId, channels] of this.userInstances) {
            for (const [channelId, instance] of channels) {
                try {
                    await instance.stop();
                } catch (e: any) {
                    // Ignore stop errors
                }
            }
        }
        this.userInstances.clear();
    }

    static getInstances(userId: string): Map<string, Channel> {
        return this.userInstances.get(userId) || new Map();
    }

    static getInstance(userId: string, channelId: string): Channel | undefined {
        const userChannels = this.getInstances(userId);
        return userChannels.get(channelId);
    }

    static async reloadUser(userId: string) {
        const channels = this.getInstances(userId);
        for (const [channelId, instance] of channels) {
            await instance.stop().catch(() => { });
        }

        const user = UserManager.getUserById(userId);
        if (user) {
            await this.loadForUser(user);
        }
    }

    static async getToolsForUser(userId: string) {
        const channels = this.getInstances(userId);
        const tools: { definition: any, handler: any }[] = [];
        for (const [channelId, instance] of channels) {
            try {
                const channelTools = await instance.getTools();
                tools.push(...channelTools);
            } catch (e: any) {
                // Log error potentially?
            }
        }
        return tools;
    }

    static async reloadGlobal() {
        await this.stopAll();
        await this.init();
    }

    // Get channel config for a user
    static async getChannelConfig(userId: string, channelId: string): Promise<ChannelConfig | null> {
        const configPath = getUserChannelConfigFile(userId, channelId);
        try {
            const content = await fs.readFile(configPath, "utf-8");
            const parsed = JSON.parse(content);
            return {
                enabled: parsed.enabled ?? false,
                settings: parsed.settings ?? {},
                secrets: parsed.secrets ?? {}
            };
        } catch {
            return null;
        }
    }

    // Save channel config for a user
    static async saveChannelConfig(userId: string, channelId: string, config: ChannelConfig) {
        const configPath = getUserChannelConfigFile(userId, channelId);
        const userDir = getUserChannelsDir(userId);
        await fs.mkdir(userDir, { recursive: true });
        await fs.writeFile(configPath, JSON.stringify(config, null, 2), "utf-8");
    }

    // Get all available channel schemas (excluding system channels like 'web')
    static getAvailableChannels() {
        return (this.AVAILABLE_CHANNELS as any[])
            .filter(ChannelClass => (ChannelClass as any).ID !== "web")
            .map(ChannelClass => {
                const instance = new ChannelClass({ id: "temp", username: "temp", role: "user", passwordHash: "" } as User, {
                    enabled: false,
                    settings: {},
                    secrets: {}
                });
                return instance.schema;
            });
    }
}
