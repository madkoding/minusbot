import { toolManager } from "./tools";
import { MemoManager } from "../memo";

toolManager.registerTool({
    type: "function",
    function: {
        name: "memo_query",
        description: "Search for memories stored by the user. Returns all memories if no search terms provided.",
        parameters: {
            type: "object",
            properties: {
                terms: {
                    type: "array",
                    items: { type: "string" },
                    description: "List of keywords to search for in keys or values."
                }
            }
        }
    }
}, async ({ terms }: { terms?: string[] }, { chat }) => {
    const userId = chat.meta.owner;
    const memos = await MemoManager.query(userId, terms);
    return JSON.stringify(memos, null, 2);
});

toolManager.registerTool({
    type: "function",
    function: {
        name: "memo_put",
        description: "Store a new memory key-value pair for the user.",
        parameters: {
            type: "object",
            properties: {
                key: { type: "string", description: "Unique key for the memory." },
                value: { type: "string", description: "Content of the memory." },
                important: { type: "boolean", description: "If true, this memory will be always loaded in the system context. Use only for critical user info (e.g. user name, bio, preferences)." }
            },
            required: ["key", "value"]
        }
    }
}, async ({ key, value, important }: { key: string, value: string, important?: boolean }, { chat }) => {
    const userId = chat.meta.owner;
    await MemoManager.put(userId, key, value, important || false);
    return `Memory stored: '${key}' (Important: ${important || false})`;
});
