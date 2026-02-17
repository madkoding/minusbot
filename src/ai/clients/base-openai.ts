import type { AIClientOption, AIProviderType } from "@shared/types";
import type { AIClient, AIModel, AIChatParams, AIChatResponse } from "../types";

export class BaseOpenAI implements AIClient {
    public id: string = "openai-custom";
    public name: string = "OpenAI Compatible";
    public types: AIProviderType[] = ["text", "vision", "image", "tts", "stt"];

    public options: AIClientOption[] = [
        {
            id: "endpoint_url",
            label: "Endpoint URL",
            type: "string",
            placeholder: "https://api.openai.com/v1",
            description: "The base URL for the OpenAI compatible API. (Include /v1 if needed)",
            required: true,
            default: "https://api.openai.com/v1"
        }
    ];

    constructor(protected defaultBaseUrl: string = "https://api.openai.com/v1") { }

    async getModels(apiKey: string, type: AIProviderType, extra?: Record<string, any>): Promise<AIModel[]> {
        if (!apiKey) return [];
        const baseUrl = extra?.endpoint_url || this.defaultBaseUrl;

        try {
            const resp = await fetch(`${baseUrl}/models`, {
                headers: { "Authorization": `Bearer ${apiKey}` }
            });
            if (!resp.ok) return [];
            const data = await resp.json() as any;
            let models = data.data.map((m: any) => ({
                id: m.id,
                name: m.id,
            }));

            // Basic filtering by type
            if (type === "vision") {
                models = models.filter((m: any) => m.id.includes("vision") || m.id.includes("gpt-4o") || m.id.includes("claude-3-5-sonnet"));
            } else if (type === "image") {
                models = models.filter((m: any) => m.id.includes("dall-e"));
            } else if (type === "tts") {
                models = models.filter((m: any) => m.id.includes("tts"));
            } else if (type === "stt") {
                models = models.filter((m: any) => m.id.includes("whisper"));
            }

            return models;
        } catch {
            return [];
        }
    }

    async chat(params: AIChatParams): Promise<AIChatResponse> {
        const baseUrl = params.extra?.endpoint_url || this.defaultBaseUrl;

        const resp = await fetch(`${baseUrl}/chat/completions`, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${params.apiKey}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: params.model,
                messages: params.messages,
                tools: params.tools,
                max_tokens: params.max_tokens,
                temperature: params.temperature
            })
        });

        if (!resp.ok) {
            const err = await resp.text();
            throw new Error(`AI Client Error: ${err}`);
        }

        const data = await resp.json() as any;
        const choice = data.choices[0].message;

        return {
            content: choice.content,
            tool_calls: choice.tool_calls,
            usage: data.usage
        };
    }
}
