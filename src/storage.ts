import { getUserDir } from "./config";
import path from "node:path";
import fs from "node:fs/promises";
import { Logger } from "./colors";

export type ChatType = "temporal" | "permanent";

export interface Message {
    role: "user" | "assistant" | "system" | "tool";
    content: string;
    name?: string;
    tool_calls?: any[];
    tool_call_id?: string;
}

export interface ChatMeta {
    id: string;
    type: ChatType;
    last_activity: string;
    title?: string;
    message_count: number;
    owner: string; // User ID
}

export interface Chat {
    meta: ChatMeta;
    messages: Message[];
}

export class Storage {
    static getChatsDir(userId: string) {
        return path.join(getUserDir(userId), "chats");
    }

    static getChatDir(userId: string, chatId: string) {
        return path.join(this.getChatsDir(userId), chatId);
    }

    static getWorkspaceDir(userId: string, chatId: string) {
        return path.join(this.getChatDir(userId, chatId), "workspace");
    }

    static async getChat(userId: string, chatId: string): Promise<Chat | null> {
        const chatDir = this.getChatDir(userId, chatId);
        const metaPath = path.join(chatDir, "meta.json");
        const historyPath = path.join(chatDir, "chat.json");

        try {
            const meta = JSON.parse(await fs.readFile(metaPath, "utf-8"));
            const messages = JSON.parse(await fs.readFile(historyPath, "utf-8"));
            return { meta, messages };
        } catch (e) {
            return null;
        }
    }

    static async saveChat(chat: Chat) {
        const userId = chat.meta.owner;
        const chatDir = this.getChatDir(userId, chat.meta.id);
        const workspaceDir = this.getWorkspaceDir(userId, chat.meta.id);

        await fs.mkdir(chatDir, { recursive: true });
        await fs.mkdir(workspaceDir, { recursive: true });

        chat.meta.last_activity = new Date().toISOString();
        chat.meta.message_count = chat.messages.length;

        const metaPath = path.join(chatDir, "meta.json");
        const historyPath = path.join(chatDir, "chat.json");

        await fs.writeFile(metaPath, JSON.stringify(chat.meta, null, 4), "utf-8");
        await fs.writeFile(historyPath, JSON.stringify(chat.messages, null, 4), "utf-8");
    }

    static async listChats(userId: string): Promise<ChatMeta[]> {
        const chatsDir = this.getChatsDir(userId);
        try {
            const dirs = await fs.readdir(chatsDir, { withFileTypes: true });
            const metas: ChatMeta[] = [];

            for (const dir of dirs) {
                if (dir.isDirectory()) {
                    const metaPath = path.join(chatsDir, dir.name, "meta.json");
                    try {
                        const meta = JSON.parse(await fs.readFile(metaPath, "utf-8"));
                        metas.push(meta);
                    } catch (e) { }
                }
            }
            return metas;
        } catch (e) {
            return [];
        }
    }

    static async deleteChat(userId: string, chatId: string) {
        const chatDir = this.getChatDir(userId, chatId);
        await fs.rm(chatDir, { recursive: true, force: true });
    }
}
