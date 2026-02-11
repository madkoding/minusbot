import { commandManager } from "./command-manager";
import { KnowledgeManager } from "../data/memory";

// /memo
commandManager.register({
    name: "memo",
    description: "Manage your personal memories.",
    usage: "/memo query [terms...] | /memo set <key> <value> | /memo setimp <key> <value> | /memo clear",
    handler: async (args, { user }) => {
        const sub = args[0]?.toLowerCase();

        if (sub === "put" || sub === "set") {
            if (args[1] && args[2]) {
                const key = args[1];
                const value = args.slice(2).join(" ");
                await KnowledgeManager.put(user.id, key, value, false);
                return `Memory stored: '${key}' = '${value}'`;
            }
            return "Usage: /memo set <key> <value>";
        }

        if (sub === "setimp" || sub === "putimp") {
            if (args[1] && args[2]) {
                const key = args[1];
                const value = args.slice(2).join(" ");
                await KnowledgeManager.put(user.id, key, value, true);
                return `Important memory stored: '${key}' = '${value}'`;
            }
            return "Usage: /memo setimp <key> <value>";
        }

        if (sub === "clear") {
            await KnowledgeManager.clear(user.id);
            return "All memories cleared.";
        }

        if (sub === "query") {
            const terms = args.slice(1);
            // query returns Record<string, string> values now, we need to load manually if we want to show 'important' status in list
            // Or just use loadMemos directly here for better debugging output
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

        return "Usage: /memo query [terms...] | /memo set <key> <value> | /memo setimp <key> <value> | /memo clear";
    }
});
