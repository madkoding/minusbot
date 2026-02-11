import { commandManager } from "./command-manager";
import { TaskManager } from "../data/tasks";

// /cron
commandManager.register({
    name: "cron",
    description: "Manage your personal scheduled tasks.",
    usage: "/cron list | /cron cancel <id>",
    handler: async (args, { user }) => {
        const sub = args[0]?.toLowerCase();
        if (sub === "list") {
            const jobs = await TaskManager.list(user.id);
            if (jobs.length === 0) return "No personal cronjobs.";

            const lines = jobs.map(j => {
                const recurringBadge = j.recurring ? "🔁" : "⏱️";
                const lastExec = j.lastExecuted ? ` | Last: ${new Date(j.lastExecuted).toLocaleString()}` : "";
                const intervalInfo = j.recurring && j.interval ? ` | Every ${j.interval}ms` : "";
                return `  ${recurringBadge} [${j.id}] Next: ${j.triggerAt}${intervalInfo}${lastExec}\n     ${j.prompt.substring(0, 60)}${j.prompt.length > 60 ? "..." : ""}`;
            });

            return `Your Cronjobs:\n${lines.join("\n")}`;
        }
        if (sub === "cancel" && args[1]) {
            await TaskManager.cancel(user.id, args[1]);
            return `Cancelled your cronjob '${args[1]}'.`;
        }
        return "Usage: /cron list | /cron cancel <id>";
    }
});
