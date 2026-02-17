import { commandManager } from "./commands";
import { Agent } from "./agent";
import { UserManager } from "./data/users";
import { Storage } from "./data/storage";
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
                // Add to history
                const userMsg: any = { role: "user", content: userInput };
                const assistantMsg: any = { role: "assistant", content: commandResult, _is_command: true };

                chat.messages.push(userMsg);
                chat.messages.push(assistantMsg);
                await Storage.saveChat(chat);

                // Publish user message for successfully handled commands
                PubSub.publish(`chat:${chatId}`, { type: "message", message: userMsg, ...metadata });

                // Publish command result so subscribers (like Web UI or Integrations) can see it
                PubSub.publish(`chat:${chatId}`, {
                    type: "message",
                    message: assistantMsg,
                    _is_command: true,
                    ...metadata
                });
                return commandResult;
            }
        }

        // Update metadata
        let metadataUpdated = false;
        if (metadata && metadata._attachments) {
            chat.meta.recentlyFileUploaded = metadata._attachments;
            metadataUpdated = true;
        }

        if (metadata && metadata._channel) {
            chat.meta.last_channel = metadata._channel;
            metadataUpdated = true;
        }

        if (metadataUpdated) {
            await Storage.saveChat(chat);
        }

        const agent = new Agent(chat);
        const response = await agent.run(userInput, metadata);
        return response || "";
    }
}
