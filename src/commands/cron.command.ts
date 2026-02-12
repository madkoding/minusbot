import { commandManager } from "./command-manager";
import { TaskManager } from "../data/tasks";

commandManager.register({
    name: "cron",
    description: "Manage your personal scheduled tasks",
    subs: [
        {
            name: "list",
            description: "List all your scheduled tasks",
            handler: async (args, { user }) => {
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
        },
        {
            name: "cancel",
            description: "Cancel a scheduled task",
            args: [
                {
                    name: "task_id",
                    description: "ID of the task to cancel",
                    type: "string",
                    required: true
                }
            ],
            handler: async (args, { user }) => {
                const taskId = args[0];
                if (!taskId) return "Error: task_id is required";

                await TaskManager.cancel(user.id, taskId);
                return `Cancelled your cronjob '${taskId}'.`;
            }
        }
    ]
});
