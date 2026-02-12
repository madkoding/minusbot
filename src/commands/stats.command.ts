import { commandManager } from "./command-manager";
import { StatsManager } from "../data/statistics";

// /stats
commandManager.register({
    name: "stats",
    description: "View your personal usage statistics",
    args: [
        {
            name: "date",
            description: "Optional date filter",
            type: "string",
            required: false
        }
    ],
    handler: async (args, { user }) => {
        const stats = await StatsManager.getStats(user.id, args[0]);
        return `Your Stats:\n  • Chats: ${stats.chats_created}\n  • Messages: ${stats.messages_sent}\n  • Tokens: ${stats.tokens_input + stats.tokens_output}`;
    }
});

// /gstats
commandManager.register({
    name: "gstats",
    description: "View global system usage statistics",
    needRole: "admin",
    args: [
        {
            name: "date",
            description: "Optional date filter",
            type: "string",
            required: false
        }
    ],
    handler: async (args) => {
        const stats = await StatsManager.getStats(undefined, args[0]);
        return `Global Stats:\n  • Chats: ${stats.chats_created}\n  • Messages: ${stats.messages_sent}\n  • Tokens: ${stats.tokens_input + stats.tokens_output}`;
    }
});
