
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
    user?: string;
    tty?: boolean;
    onlyBg?: boolean;
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
    user?: string;
    tty?: boolean;
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

import type { SandboxInstance } from "@/sandbox/instance";

export interface SkillInstance {
    id: string;
    userId: string;
    skillId: string;
    actionName: string;
    instance: SandboxInstance;
    createdAt: Date;
    isFinished: boolean;
}
