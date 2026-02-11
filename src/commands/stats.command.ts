import { commandManager } from "./command-manager";
import { StatsManager } from "../stats";

// /stats
commandManager.register({
    name: "stats",
    description: "View your personal usage statistics.",
    usage: "/stats [date]",
    handler: async (args, { user }) => {
        const stats = await StatsManager.getStats(user.id, args[0]);
        return `Your Stats:\n  • Chats: ${stats.chats_created}\n  • Messages: ${stats.messages_sent}\n  • Tokens: ${stats.tokens_input + stats.tokens_output}`;
    }
});

// /gstats
commandManager.register({
    name: "gstats",
    description: "View global system usage statistics.",
    usage: "/gstats [date]",
    needRole: "admin",
    handler: async (args) => {
        const stats = await StatsManager.getStats(undefined, args[0]);
        return `Global Stats:\n  • Chats: ${stats.chats_created}\n  • Messages: ${stats.messages_sent}\n  • Tokens: ${stats.tokens_input + stats.tokens_output}`;
    }
});
