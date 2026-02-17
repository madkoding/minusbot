import { expect, test, describe, beforeAll, afterAll } from "bun:test";
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";

describe("Chat Storage Integration", () => {
    let TMP_DIR: string;
    let ChatStore: any;

    // Setup before all tests
    beforeAll(async () => {
        // 1. Create temp directory
        TMP_DIR = await fs.mkdtemp(path.join(os.tmpdir(), "minusbot-chat-test-"));

        // 2. Set environment variable BEFORE importing modules
        process.env.MINUSBOT_HOME = TMP_DIR;

        // 3. Force module reload by using dynamic import with cache busting
        const timestamp = Date.now();
        const storageModule = await import(`../../src/data/storage.ts?t=${timestamp}`);
        ChatStore = storageModule.Storage;
    });

    // Clean up
    afterAll(async () => {
        if (TMP_DIR) {
            await fs.rm(TMP_DIR, { recursive: true, force: true });
        }
    });

    const userId = "test-user-id";
    const chatId = "test-chat-id";

    test("should create and save a chat", async () => {
        const chat = {
            meta: {
                id: chatId,
                type: "permanent",
                last_activity: new Date().toISOString(),
                message_count: 0,
                owner: userId,
                title: "Integration Test Chat"
            },
            messages: [
                { role: "system", content: "Initial System Prompt" },
                { role: "user", content: "Hello Storage!" }
            ]
        };

        await ChatStore.saveChat(chat as any);

        // Verify directory structure exists
        const chatDir = ChatStore.getChatDir(userId, chatId);
        const metaPath = path.join(chatDir, "meta.json");
        const historyPath = path.join(chatDir, "chat.json");

        expect(await fs.exists(metaPath)).toBe(true);
        expect(await fs.exists(historyPath)).toBe(true);
    });

    test("should retrieve an existing chat", async () => {
        const chat = await ChatStore.getChat(userId, chatId);
        expect(chat).not.toBeNull();
        expect(chat?.meta.id).toBe(chatId);
        expect(chat?.messages.length).toBe(2);
        expect(chat!.messages[1]!.content).toBe("Hello Storage!");
    });

    test("should list chats for user", async () => {
        // Create another chat first
        const chat2 = {
            meta: {
                id: "chat-2",
                type: "temporal",
                last_activity: new Date(Date.now() + 1000).toISOString(), // Newer
                message_count: 0,
                owner: userId,
                title: "Second Chat"
            },
            messages: []
        };
        await ChatStore.saveChat(chat2 as any);

        const chats = await ChatStore.listChats(userId);
        expect(chats.length).toBe(2);

        // Should be sorted by recent activity (chat2 is newer)
        expect(chats[0]!.id).toBe("chat-2");
        expect(chats[1]!.id).toBe(chatId);
    });

    test("should return null for non-existent chat", async () => {
        const chat = await ChatStore.getChat(userId, "missing-chat");
        expect(chat).toBeNull();
    });

    test("should delete a chat", async () => {
        await ChatStore.deleteChat(userId, chatId);
        const chat = await ChatStore.getChat(userId, chatId);
        expect(chat).toBeNull();

        // List should show only 1 (chat-2)
        const chats = await ChatStore.listChats(userId);
        expect(chats.length).toBe(1);
        expect(chats[0]!.id).toBe("chat-2");
    });
});
