import { expect, test, describe, spyOn, mock, afterEach } from "bun:test";
import { Agent } from "../../src/agent";
import { Storage } from "../../src/data/storage";

// Mock all dependencies
mock.module("../../src/data/storage", () => ({
    Storage: {
        saveChat: mock(),
        getChatContentPath: mock(() => "/tmp/chat/content")
    },
    getUserSettings: mock(() => Promise.resolve({
        ai_endpoint: "http://ai.test",
        model_id: "test-model"
    }))
}));

mock.module("../../src/secrets", () => ({
    secrets: {
        vault: mock(() => Promise.resolve({
            get: mock(() => "sk-test-key")
        }))
    }
}));

mock.module("../../src/tools/index", () => ({
    toolManager: {
        getDefinitions: mock(() => []),
        execute: mock(() => Promise.resolve("Tool Result"))
    }
}));

mock.module("../../src/data/statistics", () => ({
    StatsManager: {
        trackMessageSent: mock(),
        trackTokens: mock()
    }
}));

mock.module("../../src/cli/colors", () => ({
    Logger: {
        tool: mock(),
        skill: mock(),
        task: mock(),
        error: mock()
    }
}));

mock.module("../../src/pubsub", () => ({
    PubSub: {
        publish: mock()
    }
}));

mock.module("../../src/channels", () => ({
    ChannelManager: {
        getToolsForUser: mock(() => Promise.resolve([])),
        getInstance: mock(() => null)
    }
}));

mock.module("../../src/data/skills", () => ({
    SkillManager: {
        getToolsForUser: mock(() => Promise.resolve([]))
    }
}));

mock.module("../../src/data/memory", () => ({
    KnowledgeManager: {
        getImportantMemos: mock(() => Promise.resolve({}))
    }
}));

describe("Agent", () => {
    afterEach(() => {
        global.fetch = undefined;
    });

    test("should run conversation loop", async () => {
        const chat = {
            meta: { owner: "user1", id: "chat1" } as any,
            messages: []
        };
        const agent = new Agent(chat);

        // Mock OpenAI Fetch (Single turn)
        global.fetch = mock()
            .mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    choices: [{
                        message: {
                            role: "assistant",
                            content: "Hello World",
                            tool_calls: []
                        }
                    }],
                    usage: { prompt_tokens: 10, completion_tokens: 5 }
                })
            } as any);

        const reply = await agent.run("Hi");
        expect(reply).toBe("Hello World");

        // Check message history: System + User + Assistant = 3 messages
        // (System msg is added if empty)
        expect(chat.messages.length).toBe(3);
        expect(chat.messages[0].role).toBe("system");
        expect(chat.messages[1].role).toBe("user");
        expect(chat.messages[2].role).toBe("assistant");
    });

    test("should execute tools", async () => {
        const chat = {
            meta: { owner: "user1", id: "chat1" } as any,
            messages: []
        };
        const agent = new Agent(chat);

        // Mock OpenAI Fetch (Multi turn: Tool Call -> Tool Result -> Final Answer)

        // 1. Return Tool Call
        const toolCallMsg = {
            role: "assistant",
            content: null,
            tool_calls: [{
                id: "call_1",
                type: "function",
                function: { name: "test_tool", arguments: "{}" }
            }]
        };

        // 2. Return Final Answer
        const finalAnswerMsg = {
            role: "assistant",
            content: "Task Done",
            tool_calls: []
        };

        global.fetch = mock()
            .mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    choices: [{ message: toolCallMsg }],
                    usage: { prompt_tokens: 5, completion_tokens: 5 }
                })
            } as any)
            .mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    choices: [{ message: finalAnswerMsg }],
                    usage: { prompt_tokens: 5, completion_tokens: 5 }
                })
            } as any);

        const reply = await agent.run("Do something");

        expect(reply).toBe("Task Done");

        // History: System + User + Assistant(Call) + Tool(Result) + Assistant(Final) = 5
        expect(chat.messages.length).toBe(5);
        expect(chat.messages[2].role).toBe("assistant");
        expect(chat.messages[3].role).toBe("tool");
        expect(chat.messages[3].content).toBe("Tool Result");
    });
});
