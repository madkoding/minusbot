import { BaseOpenAI } from "./base-openai";
import type { AIProviderType } from "../types";

export class OpenAI extends BaseOpenAI {
    public override id = "openai";
    public override name = "OpenAI";
    public override types: AIProviderType[] = ["text", "vision", "image", "tts", "stt"];

    public override options = [];

    constructor() {
        super("https://api.openai.com/v1");
    }
}
