import fs from "node:fs/promises";

import { UserManager } from "../data/users";
import type { User } from "../data/users";
import { Integration } from "./integration-base";
import { SerpApiIntegration } from "./serpapi";
import { getUserIntegrationConfigFile, getUserIntegrationsDir, getGlobalIntegrationConfigFile } from "../data/storage";
import { Logger } from "../cli/colors";

export class IntegrationManager {
    private static userInstances: Map<string, Integration[]> = new Map();

    static readonly AVAILABLE_INTEGRATIONS = [
        SerpApiIntegration
    ];

    static async init() {
        const users = UserManager.getUsers();
        for (const user of users) {
            await this.loadForUser(user).catch(async e => {
                await Logger.error(`Failed to init integrations for ${user.username}: ${e.message}`);
            });
        }
    }

    static async loadForUser(user: User) {
        const userDir = getUserIntegrationsDir(user.id);

        try {
            await fs.mkdir(userDir, { recursive: true });
        } catch (e) {
            // Ignoring mkdir error if exists
        }

        const userIntegrations: Integration[] = [];

        for (const IntegrationClass of this.AVAILABLE_INTEGRATIONS) {
            // Use static ID from class
            const integrationId = (IntegrationClass as any).ID || "unknown";
            const userConfigPath = getUserIntegrationConfigFile(user.id, integrationId);
            const globalConfigPath = getGlobalIntegrationConfigFile(integrationId);

            let globalConfig = {};
            try {
                const content = await fs.readFile(globalConfigPath, "utf-8");
                globalConfig = JSON.parse(content);
            } catch { }

            let userConfig = null;
            try {
                const content = await fs.readFile(userConfigPath, "utf-8");
                userConfig = JSON.parse(content);
            } catch { }

            // If neither exists, skip
            if (!userConfig && Object.keys(globalConfig).length === 0) {
                continue;
            }

            const mergedConfig = { ...globalConfig, ...(userConfig || {}) };

            try {
                const instance = new IntegrationClass(user, mergedConfig);
                await instance.start();
                userIntegrations.push(instance);
            } catch (e: any) {
                await Logger.error(`Integration ${integrationId} failed to start for ${user.username}: ${e.message}`);
            }
        }

        this.userInstances.set(user.id, userIntegrations);
    }

    static async stopAll() {
        for (const [userId, instances] of this.userInstances) {
            for (const instance of instances) {
                try {
                    await instance.stop();
                } catch (e: any) {
                    // Ignore stop errors
                }
            }
        }
        this.userInstances.clear();
    }

    static getInstances(userId: string) {
        return this.userInstances.get(userId) || [];
    }

    static async reloadUser(userId: string) {
        const instances = this.getInstances(userId);
        for (const instance of instances) {
            await instance.stop().catch(() => { });
        }

        const user = UserManager.getUserById(userId);
        if (user) {
            await this.loadForUser(user);
        }
    }

    static async getToolsForUser(userId: string) {
        const instances = this.getInstances(userId);
        const tools: { definition: any, handler: any }[] = [];
        for (const instance of instances) {
            try {
                const integrationTools = await instance.getTools();
                tools.push(...integrationTools);
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
}
