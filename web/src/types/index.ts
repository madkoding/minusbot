export interface User {
    id: string;
    username: string;
    role: "root" | "admin" | "user";
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

export interface Channel {
    id: string;
    name: string;
    description: string;
    icon?: string;
    enabled: boolean;
    configured?: boolean;
    fields: any[];
    settings: Record<string, any>;
    secrets: Record<string, any>;
    schema: {
        id: string;
        name: string;
        description: string;
        fields: any[];
    };
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

export interface Tool {
    type: "function";
    function: {
        name: string;
        description: string;
        parameters?: any;
    };
}

export interface AIClient {
    id: string;
    name: string;
    types: string[];
    options?: any[];
}

export interface Stat {
    chats_created: number;
    messages_sent: number;
    tokens_input: number;
    tokens_output: number;
}

export interface Secret {
    id: string;
    name: string;
    description?: string;
    value?: string;
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
