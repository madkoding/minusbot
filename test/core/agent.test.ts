import { expect, test, describe, spyOn, mock, afterEach } from "bun:test";
import { EventEmitter } from "events";

import { Agent } from "@/agent";

const mockAIChat = mock();
const pubsubEmitter = new EventEmitter();

// Mock all dependencies
// Mock all dependencies
mock.module("@/data/storage", () => ({
    Storage: {
        saveChat: mock(),
        getChatContentPath: mock(() => "/tmp/chat/content")
    },
    getUserSettings: mock(() => Promise.resolve({
        active_providers: { text: "test-provider" }
    })),
    getSystemSettings: mock(() => Promise.resolve({
        system_prompt: "You are an assistant."
    }))
}));

mock.module("@/data/providers", () => ({
    ProviderManager: {
        getProvider: mock(() => Promise.resolve({
            id: "test-provider",
            name: "Test Provider",
            client: "openai",
            config: {
                model_id: "test-model",
                max_tokens: 1000,
                temperature: 0.7
            }
        })),
        getProviderToken: mock(() => Promise.resolve("sk-test-key"))
    }
}));

mock.module("@/ai/registry", () => ({
    AIRegistry: {
        getClient: mock(() => ({
            chat: mockAIChat
        }))
    }
}));

mock.module("@/secrets", () => ({
    secrets: {
        vault: mock(() => Promise.resolve({
            get: mock(() => "sk-test-key")
        }))
    }
}));

mock.module("@/tools/index", () => ({
    toolManager: {
        getDefinitions: mock(() => []),
        getToolsForAI: mock(() => []),
        getDynamicTools: mock(() => Promise.resolve([])),
        execute: mock(() => Promise.resolve("Tool Result")),
        registerTool: mock(),
        registerDynamicProvider: mock()
    }
}));

mock.module("@/data/statistics", () => ({
    StatsManager: {
        trackMessageSent: mock(),
        trackTokens: mock()
    }
}));

mock.module("@/cli/colors", () => ({
    Logger: {
        tool: mock((name, args) => console.log(`[TOOL] ${name}`)),
        skill: mock((text) => console.log(`[SKILL] ${text}`)),
        task: mock((text) => console.log(`[TASK] ${text}`)),
        error: mock((text) => console.log(`[CRIT] ${text}`)),
        info: mock((text) => console.log(`[INFO] ${text}`)),
        warn: mock((text) => console.log(`[WARN] ${text}`)),
        success: mock((text) => console.log(`[OK] ${text}`)),
        banner: mock(),
        bot: mock(),
        system: mock(),
        prompt: mock(),
        stream: mock()
    }
}));

mock.module("@/pubsub", () => ({
    PubSub: {
        publish: mock((c, d) => pubsubEmitter.emit(c, d)),
        subscribe: mock((c, l) => pubsubEmitter.on(c, l)),
        unsubscribe: mock((c, l) => pubsubEmitter.off(c, l))
    }
}));

mock.module("@/channels", () => ({
    ChannelManager: {
        getToolsForUser: mock(() => Promise.resolve([])),
        getInstance: mock(() => null)
    }
}));

mock.module("@/data/skills", () => ({
    SkillManager: {
        getToolsForUser: mock(() => Promise.resolve([]))
    }
}));

mock.module("@/data/memory", () => ({
    KnowledgeManager: {
        getImportantMemos: mock(() => Promise.resolve({}))
    }
}));

describe("Agent", () => {
    afterEach(() => {
        // @ts-ignore
        global.fetch = undefined;
    });

    test("should run conversation loop", async () => {
        const chat = {
            meta: { owner: "user1", id: "chat1" } as any,
            messages: [] as any[]
        };
        const agent = new Agent(chat);

        // Mock AI Chat (Single turn)
        mockAIChat.mockResolvedValueOnce({
            content: "Hello World",
            tool_calls: [],
            usage: { prompt_tokens: 10, completion_tokens: 5 }
        });

        const reply = await agent.run("Hi");
        expect(reply).toBe("Hello World");

        // Check message history: System + User + Assistant = 3 messages
        expect(chat.messages.length).toBe(3);
        expect(chat.messages[0]!.role).toBe("system");
        expect(chat.messages[1]!.role).toBe("user");
        expect(chat.messages[2]!.role).toBe("assistant");
    });

    test("should execute tools", async () => {
        const chat = {
            meta: { owner: "user1", id: "chat1" } as any,
            messages: [] as any[]
        };
        const agent = new Agent(chat);

        // Mock AI Chat (Multi turn: Tool Call -> Tool Result -> Final Answer)

        // 1. Return Tool Call
        const toolCallMsg = {
            content: null,
            tool_calls: [{
                id: "call_1",
                type: "function",
                function: { name: "test_tool", arguments: "{}" }
            }],
            usage: { prompt_tokens: 5, completion_tokens: 5 }
        };

        // 2. Return Final Answer
        const finalAnswerMsg = {
            content: "Task Done",
            tool_calls: [],
            usage: { prompt_tokens: 5, completion_tokens: 5 }
        };

        mockAIChat
            .mockResolvedValueOnce(toolCallMsg)
            .mockResolvedValueOnce(finalAnswerMsg);

        const reply = await agent.run("Do something");

        expect(reply).toBe("Task Done");

        // History: System + User + Assistant(Call) + Tool(Result) + Assistant(Final) = 5
        expect(chat.messages.length).toBe(5);
        expect(chat.messages[2]!.role).toBe("assistant");
        expect(chat.messages[3]!.role).toBe("tool");
        expect(chat.messages[3]!.content).toBe("Tool Result");
    });
});
