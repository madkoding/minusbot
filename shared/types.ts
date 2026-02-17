
export type Role = "root" | "admin" | "user";

export interface User {
    id: string;
    username: string;
    role: Role;
}

export interface SystemSettings {
    web_port: number;
    updater_channel: "stable" | "nightly" | "development";
    updater_stable_url: string;
    updater_nightly_url: string;
    system_prompt?: string | null;
}

export interface Settings {
    colors: boolean;
    disabled_tools: string[];
    disabled_skills: string[];
    debug?: boolean;
    active_providers?: {
        text?: string;
        vision?: string;
        image?: string;
        tts?: string;
        stt?: string;
    };
}

export interface ChannelField {
    id: string;
    label: string;
    type: "string" | "number" | "boolean" | "string-array";
    description?: string;
    placeholder?: string;
    secret?: boolean;
}

export interface ChannelSchema {
    id: string;
    name: string;
    description: string;
    icon?: string;
    fields: ChannelField[];
    vaultKeys?: string[];
}

export interface ChannelConfig {
    enabled: boolean;
    settings: Record<string, any>;
    secrets: Record<string, any>;
}

export interface ChannelStatus extends ChannelSchema {
    enabled: boolean;
    configured: boolean;
}

export interface ChannelDetail {
    enabled: boolean;
    settings: Record<string, any>;
    secretsStatus: Record<string, boolean>;
    schema: ChannelSchema;
}

export interface AIProvider {
    id: string;
    name: string;
    description?: string;
    models: string[];
    is_active: boolean;
    is_shared?: boolean;
    is_global?: boolean;
    capabilities: string[];
    type: string;
    client: string;
    config: {
        model_id: string;
        max_tokens: number;
        temperature: number;
        extra?: Record<string, any>;
    };
}

export interface Integration {
    id: string;
    name: string;
    description: string;
    icon?: string;
    enabled: boolean;
    type: "integration";
    fields?: any[];
    vaultKeys?: string[];
}

export interface IntegrationsResponse {
    available: Integration[];
    configs: Record<string, any>;
}

export interface Stat {
    chats_created: number;
    messages_sent: number;
    tokens_input: number;
    tokens_output: number;
}

export interface Skill {
    id: string;
    name: string;
    description: string;
    version: string;
    enabled: boolean;
    author?: string;
    isGlobal?: boolean;
    definition?: any;
    skillJson?: any;
}

export interface Tool {
    type: "function";
    function: {
        name: string;
        description: string;
        parameters?: any;
    };
}

export interface Message {
    role: "user" | "assistant" | "system" | "tool";
    content: string;
    name?: string;
    tool_calls?: any[];
    tool_call_id?: string;
}

export interface ChatMeta {
    id: string;
    type: "temporal" | "permanent";
    last_activity: string;
    title?: string;
    message_count: number;
    owner: string;
}

export interface Chat {
    meta: ChatMeta;
    messages: Message[];
}


export interface UpdateEntry {
    version: string;
    changes: string[];
    name: string;
    type: "update" | "securitypatch" | "hotfix";
}

export interface UpdateStatus {
    currentVersion: string;
    currentBranch: string;
    channel: string;
    updates: UpdateEntry[];
}

export interface BaseAIClient {
    id: string;
    name: string;
    types: AIProviderType[];
    options?: AIClientOption[];
}

export type AIProviderType = "text" | "image" | "tts" | "stt" | "vision";

export interface AIClientOption {
    id: string;
    label: string;
    type: "string" | "number" | "boolean" | "password";
    placeholder?: string;
    default?: any;
    description?: string;
    required?: boolean;
}
