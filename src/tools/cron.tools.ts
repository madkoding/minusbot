import { toolManager } from "../tools";
import { TaskManager } from "../data/tasks";

// Register Cron Tools
toolManager.registerTool(
    {
        type: "function",
        function: {
            name: "cronjob_list",
            description: "List all scheduled cronjobs",
        },
    },
    async (args, { chat }) => {
        return JSON.stringify(await TaskManager.list(chat.meta.owner));
    }
);

toolManager.registerTool(
    {
        type: "function",
        function: {
            name: "cronjob_add",
            description: "Add a new cronjob. Can be one-time or recurring.",
            parameters: {
                type: "object",
                properties: {
                    triggerAt: {
                        type: "string",
                        description: "ISO date string for first/next execution. If not provided, it will trigger immediately."
                    },
                    prompt: {
                        type: "string",
                        description: "Full instruction of what you (the assistant) should do when triggered. Be specific."
                    },
                    recurring: { type: "boolean", description: "If true, the job will repeat at the specified interval." },
                    intervalMs: { type: "number", description: "Interval in milliseconds for recurring jobs (minimum 10000ms)." },
                },
                required: ["prompt"],
            },
        },
    },
    async (args, { chat }) => {
        const id = Math.random().toString(36).substring(7);
        const triggerAt = args.triggerAt || new Date().toISOString();

        await TaskManager.add({
            id,
            chatId: chat.meta.id,
            userId: chat.meta.owner,
            triggerAt,
            prompt: args.prompt,
            type: "async",
            recurring: args.recurring || false,
            interval: args.intervalMs,
        });

        const recurringInfo = args.recurring ? ` (recurring every ${args.intervalMs}ms)` : " (one-time)";
        return `SUCCESS: Cronjob scheduled with ID ${id}${recurringInfo}. Next execution at ${triggerAt}. End your turn concisely.`;
    }
);

toolManager.registerTool(
    {
        type: "function",
        function: {
            name: "cronjob_cancel",
            description: "Cancel a cronjob",
            parameters: {
                type: "object",
                properties: { id: { type: "string" } },
                required: ["id"],
            },
        },
    },
    async (args, { chat }) => {
        await TaskManager.cancel(chat.meta.owner, args.id);
        return `SUCCESS: Cronjob ${args.id} has been cancelled. Confirm this to the user and finish.`;
    }
);

toolManager.registerTool(
    {
        type: "function",
        function: {
            name: "cronjob_join",
            description: "Schedule a cronjob and wait for it in sync mode. This will pause the current chat until the time is reached.",
            parameters: {
                type: "object",
                properties: {
                    triggerAt: { type: "string", description: "ISO date string" },
                    prompt: { type: "string" },
                },
                required: ["triggerAt", "prompt"],
            },
        },
    },
    async (args, { chat }) => {
        const joinId = Math.random().toString(36).substring(7);
        await TaskManager.add({
            id: joinId,
            chatId: chat.meta.id,
            userId: chat.meta.owner,
            triggerAt: args.triggerAt,
            prompt: args.prompt,
            type: "sync",
        });
        return `Cronjob joined with ID: ${joinId}. This chat flow will pause until the scheduled time.`;
    }
);
