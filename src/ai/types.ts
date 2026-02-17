export type AIProviderType = "text" | "image" | "tts" | "stt" | "vision";

export interface AIModel {
    id: string;
    name: string;
    description?: string;
    context_window?: number;
    max_output?: number;
}

export interface AIClient {
    id: string;
    name: string;
    types: AIProviderType[];

    // Options definition
    options?: AIClientOption[];

    // Model listing
    getModels(apiKey: string, type: AIProviderType, extra?: Record<string, any>): Promise<AIModel[]>;

    chat(params: AIChatParams): Promise<AIChatResponse>;
}

export interface AIChatParams {
    apiKey: string;
    model: string;
    messages: any[];
    tools?: any[];
    max_tokens?: number;
    temperature?: number;
    extra?: Record<string, any>;
}

export interface AIChatResponse {
    content: string;
    tool_calls?: any[];
    usage?: {
        prompt_tokens: number;
        completion_tokens: number;
    };
}

export interface AIProviderConfig {
    model_id: string;
    max_tokens?: number;
    temperature?: number;
    extra?: Record<string, any>;
}

export interface AIProvider {
    id: string;
    name: string;
    type: AIProviderType;
    client: string; // Client ID (openai, openrouter, etc.)
    config: AIProviderConfig;
    is_global: boolean;
    owner?: string; // User ID
}

export interface ActiveProviders {
    text?: string;
    vision?: string;
    image?: string;
    tts?: string;
    stt?: string;
}

export interface AIClientOption {
    id: string;
    label: string;
    type: "string" | "number" | "boolean" | "password";
    placeholder?: string;
    default?: any;
    description?: string;
    required?: boolean;
}
