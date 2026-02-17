
export interface BinaryDefinition {
    name: string;
    urls: Record<string, string>;
    actions: string[];
}

export interface SkillAction {
    name: string;
    description: string;
    parameters: any;
    _script: string;
    dockerImage?: string;
    extraVolumes?: string[];
    enableNetwork?: boolean;
    networkMode?: "bridge" | "host" | "none";
    args?: Record<string, any>;
}

export interface SkillDefinition {
    id: string;
    displayName: string;
    description: string;
    vaultKeys?: string[];
    requiredVaultKeys?: string[];
    configSchema?: any;
    bins?: BinaryDefinition[];
    dockerImage?: string;
    enableNetwork?: boolean;
    networkMode?: "bridge" | "host" | "none";
    actions: SkillAction[];
    enabled?: boolean;
}

export interface Skill {
    id: string; // The folder name
    definition: SkillDefinition;
    enabled: boolean;
    isGlobal: boolean;
    path: string; // Absolute path to the skill directory
}
