import { toolManager } from "./tools";
import { FileSystem } from "../sandbox/filesystem";
import { ChannelManager } from "../channels";

toolManager.registerTool({
    type: "function",
    function: {
        name: "fs_mkdir",
        description: "Create a directory in the workspace. Use workspaceId='chat' to use the current chat space.",
        parameters: {
            type: "object",
            properties: {
                workspaceId: { type: "string" },
                path: { type: "string" }
            },
            required: ["path"]
        }
    }
}, async ({ workspaceId, path }, { chat }) => {
    try {
        return await FileSystem.mkdir(chat.meta.owner, workspaceId, path, chat.meta.id);
    } catch (e: any) {
        return `Error: ${e.message}`;
    }
});

toolManager.registerTool({
    type: "function",
    function: {
        name: "fs_rm",
        description: "Remove a file or directory from the workspace. Use workspaceId='chat' to use the current chat space.",
        parameters: {
            type: "object",
            properties: {
                workspaceId: { type: "string" },
                path: { type: "string" }
            },
            required: ["path"]
        }
    }
}, async ({ workspaceId, path }, { chat }) => {
    try {
        return await FileSystem.rm(chat.meta.owner, workspaceId, path, chat.meta.id);
    } catch (e: any) {
        return `Error: ${e.message}`;
    }
});

toolManager.registerTool({
    type: "function",
    function: {
        name: "fs_read",
        description: "Read a file from the workspace. Use workspaceId='chat' to use the current chat space.",
        parameters: {
            type: "object",
            properties: {
                workspaceId: { type: "string" },
                path: { type: "string" }
            },
            required: ["path"]
        }
    }
}, async ({ workspaceId, path }, { chat }) => {
    try {
        return await FileSystem.read(chat.meta.owner, workspaceId, path, chat.meta.id);
    } catch (e: any) {
        return `Error: ${e.message}`;
    }
});

toolManager.registerTool({
    type: "function",
    function: {
        name: "fs_write",
        description: "Write content to a file in the workspace. Use workspaceId='chat' to use the current chat space.",
        parameters: {
            type: "object",
            properties: {
                workspaceId: { type: "string" },
                path: { type: "string" },
                content: { type: "string" }
            },
            required: ["path", "content"]
        }
    }
}, async ({ workspaceId, path, content }, { chat }) => {
    try {
        return await FileSystem.write(chat.meta.owner, workspaceId, path, content, chat.meta.id);
    } catch (e: any) {
        return `Error: ${e.message}`;
    }
});

toolManager.registerTool({
    type: "function",
    function: {
        name: "fs_stat",
        description: "Get file or directory status. Use workspaceId='chat' to use the current chat space.",
        parameters: {
            type: "object",
            properties: {
                workspaceId: { type: "string" },
                path: { type: "string" }
            },
            required: ["path"]
        }
    }
}, async ({ workspaceId, path }, { chat }) => {
    try {
        return await FileSystem.stat(chat.meta.owner, workspaceId, path, chat.meta.id);
    } catch (e: any) {
        return `Error: ${e.message}`;
    }
});

toolManager.registerTool({
    type: "function",
    function: {
        name: "fs_ls",
        description: "List files in a directory. Use workspaceId='chat' to use the current chat space.",
        parameters: {
            type: "object",
            properties: {
                workspaceId: { type: "string" },
                path: { type: "string" }
            },
            required: ["path"]
        }
    }
}, async ({ workspaceId, path }, { chat }) => {
    try {
        return await FileSystem.ls(chat.meta.owner, workspaceId, path || ".", chat.meta.id);
    } catch (e: any) {
        return `Error: ${e.message}`;
    }
});

toolManager.registerTool({
    type: "function",
    function: {
        name: "fs_sendfile",
        description: "Send a file from the workspace to the user via their current channel (e.g. Telegram). Use workspaceId='chat' to use the current chat space.",
        parameters: {
            type: "object",
            properties: {
                workspaceId: { type: "string" },
                path: { type: "string" }
            },
            required: ["path"]
        }
    }
}, async ({ workspaceId, path }, { chat }) => {
    try {
        const lastChannelId = chat.meta.last_channel;
        if (!lastChannelId) {
            return "Error: No active channel found for this chat. I don't know where to send the file.";
        }

        const channel = ChannelManager.getInstance(chat.meta.owner, lastChannelId);
        if (!channel) {
            return `Error: Active channel '${lastChannelId}' not found or disabled.`;
        }

        const resolvedPath = await FileSystem.resolvePath(chat.meta.owner, workspaceId, path, chat.meta.id);

        // Ensure file exists
        const fs = await import("node:fs/promises"); // Dynamic import to avoid top-level require if not needed
        await fs.access(resolvedPath);

        await channel.sendFile(resolvedPath);
        return `File '${path}' sent via ${channel.name}.`;
    } catch (e: any) {
        // If file not found, try to be helpful
        if (e.code === 'ENOENT') {
            return `Error: File '${path}' not found in the specified workspace.`;
        }
        return `Error sending file: ${e.message}`;
    }
});
