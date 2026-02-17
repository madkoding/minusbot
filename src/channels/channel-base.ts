import type { User } from "../data/users";
import { secrets } from "../secrets";
import type { ToolDefinition, ToolHandler } from "../tools/tools";
import type { ChannelField, ChannelSchema, ChannelConfig } from "@shared/types";

export abstract class Channel {
    // These must be implemented as instance properties and match static ones
    abstract readonly id: string;
    abstract readonly name: string;
    abstract readonly description: string;
    abstract readonly icon?: string;
    abstract readonly schema: ChannelSchema;

    constructor(protected user: User, protected config: ChannelConfig) { }

    abstract start(): Promise<void>;
    abstract stop(): Promise<void>;
    abstract sendFile(filePath: string, filename?: string): Promise<void>;

    // Validate config before saving
    async validate(config: ChannelConfig): Promise<boolean> {
        return true;
    }

    // Helper to get vault for this channel (user-specific)
    protected async getVault(userId: string) {
        const vaultId = `channel-${this.id}`;
        return await secrets.vault(userId, vaultId);
    }

    // Helper to get admin vault for this channel (global secrets)
    protected async getAdminVault() {
        const vaultId = `channel-${this.id}-admin`;
        return await secrets.globalVault(vaultId);
    }

    // Get merged secrets (admin + user overrides)
    protected async getSecrets(): Promise<Record<string, any>> {
        const adminVault = await this.getAdminVault();
        const userVault = await this.getVault(this.user.id);

        const merged: Record<string, any> = {};

        // Start with admin vault keys
        if (this.schema.vaultKeys) {
            for (const key of this.schema.vaultKeys) {
                const adminValue = adminVault.get(key);
                if (adminValue) {
                    merged[key] = adminValue;
                }
            }
        }

        // Override with user secrets
        if (this.config.secrets) {
            for (const [key, value] of Object.entries(this.config.secrets)) {
                if (value) {
                    merged[key] = value;
                }
            }
        }

        return merged;
    }

    // Return tools provided by this channel
    async getTools(): Promise<{ definition: ToolDefinition, handler: ToolHandler }[]> {
        return [];
    }

    protected formatUploadNotification(filenames: string[]): string {
        if (filenames.length === 0) return "";
        return `\n\n[System Notification: User uploaded ${filenames.length} file(s) to workspace: chat. Filenames: ${filenames.join(", ")}]`;
    }
}
