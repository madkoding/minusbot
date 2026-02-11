import { commandManager } from "./commands";
import { Agent } from "./agent";
import { UserManager } from "./users";
import { Storage } from "./storage";
import { PubSub } from "./pubsub";

export class InputProcessor {
    static async process(userInput: string, userId: string, chatId: string, metadata: any = {}): Promise<string> {
        const user = UserManager.getUserById(userId);
        if (!user) throw new Error("User not found");

        let chat = await Storage.getChat(userId, chatId);
        if (!chat) {
            chat = {
                meta: {
                    id: chatId,
                    type: "permanent",
                    last_activity: new Date().toISOString(),
                    message_count: 0,
                    owner: userId
                },
                messages: []
            };
            await Storage.saveChat(chat);
        }

        // 1. Try handling as a command
        if (userInput.startsWith("/")) {
            const commandResult = await commandManager.handle(userInput, user, chat);
            if (commandResult !== null) {
                // Publish user message for successfully handled commands
                const userMsg = { role: "user", content: userInput };
                PubSub.publish(`chat:${chatId}`, { type: "message", message: userMsg, ...metadata });

                // Publish command result so subscribers (like Web UI or Integrations) can see it
                PubSub.publish(`chat:${chatId}`, {
                    type: "message",
                    message: {
                        role: "assistant",
                        content: commandResult
                    },
                    _is_command: true,
                    ...metadata
                });
                return commandResult;
            }
        }

        // 2. Fallback to AI Agent
        if (metadata && metadata._attachments) {
            chat.meta.recentlyFileUploaded = metadata._attachments;
        }

        const agent = new Agent(chat);
        const response = await agent.run(userInput, metadata);
        return response || "";
    }
}
