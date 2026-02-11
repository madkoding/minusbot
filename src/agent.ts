import { getUserSettings } from "./config";
import { secrets } from "./secrets";
import type { Message, Chat } from "./storage";
import { Storage } from "./storage";
import { toolManager } from "./tools/index";
import { StatsManager } from "./stats";
import { Logger } from "./colors";
import { PubSub } from "./pubsub";

export class Agent {
    constructor(private chat: Chat) { }

    async run(userInput?: string) {
        const userId = this.chat.meta.owner;

        if (userInput) {
            const userMsg: Message = { role: "user", content: userInput };
            this.chat.messages.push(userMsg);
            PubSub.publish(`chat:${this.chat.meta.id}`, { type: "message", message: userMsg });
            await StatsManager.trackMessageSent(userId);
        }

        const vault = await secrets.vault(userId, "agent");
        let apiKey = vault.get("API_KEY");
        const settings = await getUserSettings(userId);

        if (!apiKey) {
            throw new Error(`API_KEY not found. Please establish your credentials:
1. In CLI: /env set agent API_KEY sk-xxxx
2. In Dashboard: Personal > Secrets > agent.vault`);
        }

        while (true) {
            const tools = toolManager.getDefinitions(settings.disabled_tools || []);

            const response = await fetch(`${settings.ai_endpoint}/chat/completions`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${apiKey}`,
                },
                body: JSON.stringify({
                    model: settings.model_id,
                    messages: this.chat.messages,
                    tools: tools,
                }),
            });

            if (!response.ok) {
                const error = await response.text();
                throw new Error(`AI API error: ${error}`);
            }

            const data = await response.json() as any;
            const message = data.choices[0].message;

            const usage = data.usage;
            if (usage) {
                await StatsManager.trackTokens(userId, usage.prompt_tokens, usage.completion_tokens);
            }

            this.chat.messages.push(message);
            PubSub.publish(`chat:${this.chat.meta.id}`, { type: "message", message });
            await Storage.saveChat(this.chat);

            if (!message.tool_calls || message.tool_calls.length === 0) {
                return message.content;
            }

            // Handle tool calls
            for (const toolCall of message.tool_calls) {
                const { name } = toolCall.function;
                const args = JSON.parse(toolCall.function.arguments);

                if (name.startsWith("skill_")) {
                    await Logger.skill(`Calling skill: ${name} (${JSON.stringify(args)})`);
                } else if (name.startsWith("cronjob_")) {
                    await Logger.task(`Scheduling task: ${name} (${JSON.stringify(args)})`);
                } else {
                    await Logger.tool(name, args);
                }

                let result = "";
                if ((settings.disabled_tools || []).includes(name)) {
                    result = `Error: Tool ${name} is disabled.`;
                } else {
                    result = await toolManager.execute(name, args, this.chat);
                }

                if (result.includes("Error") || result.toLowerCase().includes("failed")) {
                    if (name.startsWith("skill_")) {
                        await Logger.error(`Skill failure: ${name} -> ${result}`);
                    } else if (name.startsWith("cronjob_")) {
                        await Logger.error(`Task failure: ${name} -> ${result}`);
                    } else {
                        await Logger.error(`Tool failure: ${name} -> ${result}`);
                    }
                }

                this.chat.messages.push({
                    role: "tool",
                    content: result,
                    tool_call_id: toolCall.id,
                });
            }
            await Storage.saveChat(this.chat);
        }
    }
}
