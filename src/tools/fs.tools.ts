import { commandManager } from "../commands";
import { toolManager } from "./tools";
import { FileSystem } from "../fs/index";

// Commands
commandManager.register({
    name: "fs",
    description: "Manage filesystem in a workspace.",
    usage: "/fs mkdir [workspaceId] <path> | rm [workspaceId] <path> | read [workspaceId] <path> | write [workspaceId] <path> <content> | stat [workspaceId] <path> | ls [workspaceId] <path>",
    handler: async (args, { user, chat }) => {
        const sub = args[0];
        if (!sub) return "Usage: /fs mkdir [workspaceId] <path> | rm [workspaceId] <path> | read [workspaceId] <path> | write [workspaceId] <path> <content> | stat [workspaceId] <path> | ls [workspaceId] [path]";

        let workspaceId = args[1];
        let pathArg = args[2];

        // Heuristic to detect if workspaceId was skipped
        if (["ls", "read", "rm", "mkdir", "stat"].includes(sub)) {
            // If only 2 total args (/fs ls path), then args[1] is path
            if (args.length === 2) {
                pathArg = args[1];
                workspaceId = "chat";
            }
        }

        if (sub === "write") {
            if (args.length < 3) return "Usage: /fs write [workspaceId] <path> <content>";
            // If total args are 3 (/fs write path content), then args[1] is path
            if (args.length === 3) {
                pathArg = args[1];
                workspaceId = "chat";
            } else if (args.length > 3) {
                // If we have 4+ args, peer if args[1] looks like a path
                if (args[1]?.includes("/") || args[1]?.includes(".") || args[1] === "chat") {
                    pathArg = args[1];
                    workspaceId = "chat";
                }
            }
        }

        const userId = user.id;

        try {
            switch (sub) {
                case "mkdir":
                    if (!pathArg) return "Error: Missing path argument.";
                    return await FileSystem.mkdir(userId, workspaceId, pathArg, chat.meta.id);
                case "rm":
                    if (!pathArg) return "Error: Missing path argument.";
                    return await FileSystem.rm(userId, workspaceId, pathArg, chat.meta.id);
                case "read":
                    if (!pathArg) return "Error: Missing path argument.";
                    return await FileSystem.read(userId, workspaceId, pathArg, chat.meta.id);
                case "write":
                    const contentStartIdx = (workspaceId === "chat") ? 2 : 3;
                    const content = args.slice(contentStartIdx).join(" ");
                    if (!pathArg || !content) return "Error: Missing path or content argument.";
                    return await FileSystem.write(userId, workspaceId, pathArg, content, chat.meta.id);
                case "stat":
                    if (!pathArg) return "Error: Missing path argument.";
                    return await FileSystem.stat(userId, workspaceId, pathArg, chat.meta.id);
                case "ls":
                    return await FileSystem.ls(userId, workspaceId, pathArg || ".", chat.meta.id);
                default:
                    return "Unknown sub-command.";
            }
        } catch (e: any) {
            return `FS Error: ${e.message}`;
        }
    }
});

// Tools

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
