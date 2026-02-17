import type { AIClient } from "./types";
import { OpenAI } from "./clients/openai";
import { OpenRouter } from "./clients/openrouter";
import { BaseOpenAI } from "./clients/base-openai";

export class AIRegistry {
    private static clients: Map<string, AIClient> = new Map([
        ["openai", new OpenAI()],
        ["openrouter", new OpenRouter()],
        ["openai-custom", new BaseOpenAI()]
    ]);

    static getClient(id: string): AIClient | undefined {
        return this.clients.get(id);
    }

    static getAllClients(): AIClient[] {
        return Array.from(this.clients.values());
    }
}
