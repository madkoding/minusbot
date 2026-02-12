import { commandManager } from "./command-manager";
import { KnowledgeManager } from "../data/memory";

commandManager.register({
    name: "memo",
    description: "Manage your personal memories",
    subs: [
        {
            name: "query",
            description: "Query your memories",
            args: [
                {
                    name: "terms",
                    description: "Search terms (optional)",
                    type: "string",
                    required: false
                }
            ],
            handler: async (args, { user }) => {
                const terms = args;
                const allMemos = await KnowledgeManager.loadMemos(user.id);
                let filteredKeys = Object.keys(allMemos);

                if (terms.length > 0) {
                    const search = terms.map(t => t.toLowerCase());
                    filteredKeys = filteredKeys.filter(k => {
                        const val = allMemos[k];
                        if (!val) return false;
                        const vStr = typeof val === 'string' ? val : val.value;
                        return search.some(s => k.toLowerCase().includes(s) || vStr.toLowerCase().includes(s));
                    });
                }

                if (filteredKeys.length === 0) {
                    return "No memories found matching your criteria.";
                }

                const lines = filteredKeys.map(k => {
                    const item = allMemos[k];
                    if (!item) return "";
                    const val = typeof item === 'string' ? item : item.value;
                    const imp = typeof item !== 'string' && item.important ? " [IMPORTANT]" : "";
                    return `  • ${k}${imp}: ${val}`;
                }).filter(Boolean);
                return `Memories:\n${lines.join("\n")}`;
            }
        },
        {
            name: "set",
            description: "Store a memory",
            args: [
                {
                    name: "key",
                    description: "Memory key",
                    type: "string",
                    required: true
                },
                {
                    name: "value",
                    description: "Memory value",
                    type: "string",
                    required: true
                }
            ],
            handler: async (args, { user }) => {
                const key = args[0];
                const value = args.slice(1).join(" ");

                if (!key || !value) {
                    return "Error: key and value are required";
                }

                await KnowledgeManager.put(user.id, key, value, false);
                return `Memory stored: '${key}' = '${value}'`;
            }
        },
        {
            name: "setimp",
            description: "Store an important memory",
            args: [
                {
                    name: "key",
                    description: "Memory key",
                    type: "string",
                    required: true
                },
                {
                    name: "value",
                    description: "Memory value",
                    type: "string",
                    required: true
                }
            ],
            handler: async (args, { user }) => {
                const key = args[0];
                const value = args.slice(1).join(" ");

                if (!key || !value) {
                    return "Error: key and value are required";
                }

                await KnowledgeManager.put(user.id, key, value, true);
                return `Important memory stored: '${key}' = '${value}'`;
            }
        },
        {
            name: "clear",
            description: "Clear all memories",
            handler: async (args, { user }) => {
                await KnowledgeManager.clear(user.id);
                return "All memories cleared.";
            }
        }
    ]
});
