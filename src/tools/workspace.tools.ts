import { toolManager } from "./tools";
import { commandManager } from "../commands";
import { WorkspaceManager } from "../workspaces";

// Commands
commandManager.register({
    name: "workspaces",
    description: "Manage your workspaces.",
    usage: "/workspaces list | create <name> | delete <id>",
    handler: async (args, { user }) => {
        const sub = args[0];
        if (sub === "list" || !sub) {
            const list = await WorkspaceManager.list(user.id);
            if (list.length === 0) return "No workspaces found.";
            return list.map(w => `[${w.id}] ${w.displayName}`).join("\n");
        }
        if (sub === "create" && args[1]) {
            const name = args.slice(1).join(" ");
            const workspace = await WorkspaceManager.create(user.id, name);
            return `Workspace '${workspace.displayName}' created (ID: ${workspace.id}).`;
        }
        if (sub === "delete" && args[1]) {
            await WorkspaceManager.delete(user.id, args[1]);
            return `Workspace '${args[1]}' deleted.`;
        }
        return "Usage: /workspaces list | create <name> | delete <id>";
    }
});

// Tools
toolManager.registerTool({
    type: "function",
    function: {
        name: "workspace_list",
        description: "List all user workspaces.",
        parameters: {
            type: "object",
            properties: {}
        }
    }
}, async (_, { chat }) => {
    try {
        const list = await WorkspaceManager.list(chat.meta.owner);
        return JSON.stringify(list);
    } catch (e: any) {
        return `Error: ${e.message}`;
    }
});

toolManager.registerTool({
    type: "function",
    function: {
        name: "workspace_create",
        description: "Create a new workspace.",
        parameters: {
            type: "object",
            properties: {
                displayName: { type: "string" },
                meta: { type: "object", description: "Additional metadata (optional)." }
            },
            required: ["displayName"]
        }
    }
}, async ({ displayName, meta }, { chat }) => {
    try {
        const workspace = await WorkspaceManager.create(chat.meta.owner, displayName, meta);
        return JSON.stringify(workspace);
    } catch (e: any) {
        return `Error: ${e.message}`;
    }
});

toolManager.registerTool({
    type: "function",
    function: {
        name: "workspace_get",
        description: "Get workspace details.",
        parameters: {
            type: "object",
            properties: {
                id: { type: "string" }
            },
            required: ["id"]
        }
    }
}, async ({ id }, { chat }) => {
    try {
        const workspace = await WorkspaceManager.get(chat.meta.owner, id);
        if (!workspace) return "Workspace not found.";
        return JSON.stringify(workspace);
    } catch (e: any) {
        return `Error: ${e.message}`;
    }
});

toolManager.registerTool({
    type: "function",
    function: {
        name: "workspace_delete",
        description: "Delete a workspace.",
        parameters: {
            type: "object",
            properties: {
                id: { type: "string" }
            },
            required: ["id"]
        }
    }
}, async ({ id }, { chat }) => {
    try {
        await WorkspaceManager.delete(chat.meta.owner, id);
        return `Workspace ${id} deleted.`;
    } catch (e: any) {
        return `Error: ${e.message}`;
    }
});
