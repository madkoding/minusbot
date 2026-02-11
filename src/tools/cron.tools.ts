import { toolManager } from ".";
import { CronManager } from "../cron";

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
        return JSON.stringify(await CronManager.list(chat.meta.owner));
    }
);

toolManager.registerTool(
    {
        type: "function",
        function: {
            name: "cronjob_add",
            description: "Add a new cronjob",
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
        const id = Math.random().toString(36).substring(7);
        await CronManager.add({
            id,
            chatId: chat.meta.id,
            userId: chat.meta.owner,
            triggerAt: args.triggerAt,
            prompt: args.prompt,
            type: "async",
        });
        return `Cronjob added with ID: ${id}`;
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
        await CronManager.cancel(chat.meta.owner, args.id);
        return `Cronjob ${args.id} cancelled`;
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
        await CronManager.add({
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
