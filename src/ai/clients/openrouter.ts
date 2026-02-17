import { BaseOpenAI } from "./base-openai";
import type { AIProviderType } from "../types";

export class OpenRouter extends BaseOpenAI {
    public override id = "openrouter";
    public override name = "OpenRouter";
    public override types: AIProviderType[] = ["text", "vision"];

    public override options = [];

    constructor() {
        super("https://openrouter.ai/api/v1");
    }
}
