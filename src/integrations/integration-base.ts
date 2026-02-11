import type { User } from "../data/users";
import { secrets } from "../secrets";
import type { ToolDefinition, ToolHandler } from "../tools/tools";

export interface IntegrationField {
    id: string;
    label: string;
    type: "string" | "number" | "boolean" | "string-array";
    description?: string;
    placeholder?: string;
}

export interface IntegrationSchema {
    id: string;
    name: string;
    description: string;
    fields: IntegrationField[];
    vaultId?: string;
    vaultKeys?: string[];
}

export abstract class Integration {
    // These must be implemented as instance properties and match static ones
    abstract readonly id: string;
    abstract readonly name: string;
    abstract readonly description: string;
    abstract readonly schema: IntegrationSchema;

    constructor(protected user: User, protected config: any) { }

    abstract start(): Promise<void>;
    abstract stop(): Promise<void>;

    // Validate config before saving
    async validate(config: any): Promise<boolean> {
        return true;
    }

    // Helper to get vault for this integration
    protected async getVault(userId: string) {
        const vaultId = this.schema.vaultId || `integration-${this.id}`;
        return await secrets.vault(userId, vaultId);
    }

    // Return tools provided by this integration
    async getTools(): Promise<{ definition: ToolDefinition, handler: ToolHandler }[]> {
        return [];
    }
}
