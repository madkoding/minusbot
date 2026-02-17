import fs from "node:fs/promises";
import path from "node:path";

import {
    getSharedDir,
    getUserDir as getBaseUserDir
} from "./storage";
import type { AIProvider } from "../ai/types";
import { secrets } from "../secrets";

export const GLOBAL_PROVIDERS_FILE = path.join(getSharedDir(), "providers.json");

export class ProviderManager {
    private static getUserProvidersFile(userId: string) {
        return path.join(getBaseUserDir(userId), "providers.json");
    }

    static async listProviders(userId?: string): Promise<AIProvider[]> {
        const global = await this.readProviders(GLOBAL_PROVIDERS_FILE, true);
        if (!userId) return global;

        const user = await this.readProviders(this.getUserProvidersFile(userId), false, userId);
        return [...global, ...user];
    }

    private static async readProviders(file: string, isGlobal: boolean, userId?: string): Promise<AIProvider[]> {
        try {
            const content = await fs.readFile(file, "utf-8");
            const data = JSON.parse(content);
            return data.map((p: any) => ({ ...p, is_global: isGlobal, owner: userId }));
        } catch {
            return [];
        }
    }

    static async saveProvider(provider: AIProvider, userId?: string) {
        const isGlobal = !userId;
        const file = isGlobal ? GLOBAL_PROVIDERS_FILE : this.getUserProvidersFile(userId!);

        const providers = await this.readProviders(file, isGlobal, userId);
        const index = providers.findIndex(p => p.id === provider.id);

        if (index >= 0) {
            providers[index] = provider;
        } else {
            providers.push(provider);
        }

        await fs.mkdir(path.dirname(file), { recursive: true });
        await fs.writeFile(file, JSON.stringify(providers, null, 4), "utf-8");
    }

    static async deleteProvider(id: string, userId?: string) {
        const isGlobal = !userId;
        const file = isGlobal ? GLOBAL_PROVIDERS_FILE : this.getUserProvidersFile(userId!);

        const providers = await this.readProviders(file, isGlobal, userId);
        const filtered = providers.filter(p => p.id !== id);

        await fs.writeFile(file, JSON.stringify(filtered, null, 4), "utf-8");

        // Also delete from vault
        const vault = isGlobal ? await secrets.globalVault("providers") : await secrets.userVault(userId!, "providers");
        await vault.delete(id);
    }

    static async getProvider(id: string, userId?: string): Promise<AIProvider | null> {
        const providers = await this.listProviders(userId);
        return providers.find(p => p.id === id) || null;
    }

    static async getProviderToken(id: string, userId?: string): Promise<string | null> {
        const provider = await this.getProvider(id, userId);
        if (!provider) return null;

        const vault = provider.is_global
            ? await secrets.globalVault("providers")
            : await secrets.userVault(userId!, "providers");

        return await vault.get(provider.id) || null;
    }

    static async setProviderToken(id: string, token: string, userId?: string) {
        const provider = await this.getProvider(id, userId);
        if (!provider) throw new Error("Provider not found");

        const vault = provider.is_global
            ? await secrets.globalVault("providers")
            : await secrets.userVault(userId!, "providers");

        await vault.set(provider.id, token);
    }
}
