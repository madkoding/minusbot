import { commandManager } from "../commands";
import { toolManager } from "./tools";
import { FileSystem } from "../fs/index";

// Commands
commandManager.register({
    name: "fs",
    description: "Manage filesystem in the chat workspace.",
    usage: "/fs mkdir <path> | rm <path> | read <path> | write <path> <content> | stat <path> | ls <path>",
    handler: async (args, { user, chat }) => {
        const sub = args[0];
        const pathArg = args[1];

        if (!sub) return "Usage: /fs mkdir <path> | rm <path> | read <path> | write <path> <content> | stat <path> | ls <path>";

        const userId = chat.meta.owner;
        const chatId = chat.meta.id;

        try {
            switch (sub) {
                case "mkdir":
                    if (!pathArg) return "Error: Missing path argument.";
                    return await FileSystem.mkdir(userId, chatId, pathArg);
                case "rm":
                    if (!pathArg) return "Error: Missing path argument.";
                    return await FileSystem.rm(userId, chatId, pathArg);
                case "read":
                    if (!pathArg) return "Error: Missing path argument.";
                    return await FileSystem.read(userId, chatId, pathArg);
                case "write":
                    if (!pathArg || !args[2]) return "Error: Missing path or content argument.";
                    const content = args.slice(2).join(" ");
                    return await FileSystem.write(userId, chatId, pathArg, content);
                case "stat":
                    if (!pathArg) return "Error: Missing path argument.";
                    return await FileSystem.stat(userId, chatId, pathArg);
                case "ls":
                    return await FileSystem.ls(userId, chatId, pathArg || ".");
                default:
                    return "Unknown sub-command. Usage: /fs mkdir <path> | rm <path> | read <path> | write <path> <content> | stat <path> | ls <path>";
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
        description: "Create a directory in the workspace.",
        parameters: {
            type: "object",
            properties: {
                path: { type: "string" }
            },
            required: ["path"]
        }
    }
}, async ({ path }, { chat }) => {
    try {
        return await FileSystem.mkdir(chat.meta.owner, chat.meta.id, path);
    } catch (e: any) {
        return `Error: ${e.message}`;
    }
});

toolManager.registerTool({
    type: "function",
    function: {
        name: "fs_rm",
        description: "Remove a file or directory from the workspace.",
        parameters: {
            type: "object",
            properties: {
                path: { type: "string" }
            },
            required: ["path"]
        }
    }
}, async ({ path }, { chat }) => {
    try {
        return await FileSystem.rm(chat.meta.owner, chat.meta.id, path);
    } catch (e: any) {
        return `Error: ${e.message}`;
    }
});

toolManager.registerTool({
    type: "function",
    function: {
        name: "fs_read",
        description: "Read a file from the workspace.",
        parameters: {
            type: "object",
            properties: {
                path: { type: "string" }
            },
            required: ["path"]
        }
    }
}, async ({ path }, { chat }) => {
    try {
        return await FileSystem.read(chat.meta.owner, chat.meta.id, path);
    } catch (e: any) {
        return `Error: ${e.message}`;
    }
});

toolManager.registerTool({
    type: "function",
    function: {
        name: "fs_write",
        description: "Write content to a file in the workspace.",
        parameters: {
            type: "object",
            properties: {
                path: { type: "string" },
                content: { type: "string" }
            },
            required: ["path", "content"]
        }
    }
}, async ({ path, content }, { chat }) => {
    try {
        return await FileSystem.write(chat.meta.owner, chat.meta.id, path, content);
    } catch (e: any) {
        return `Error: ${e.message}`;
    }
});

toolManager.registerTool({
    type: "function",
    function: {
        name: "fs_stat",
        description: "Get file or directory status.",
        parameters: {
            type: "object",
            properties: {
                path: { type: "string" }
            },
            required: ["path"]
        }
    }
}, async ({ path }, { chat }) => {
    try {
        return await FileSystem.stat(chat.meta.owner, chat.meta.id, path);
    } catch (e: any) {
        return `Error: ${e.message}`;
    }
});

toolManager.registerTool({
    type: "function",
    function: {
        name: "fs_ls",
        description: "List files in a directory.",
        parameters: {
            type: "object",
            properties: {
                path: { type: "string" }
            },
            required: ["path"]
        }
    }
}, async ({ path }, { chat }) => {
    try {
        return await FileSystem.ls(chat.meta.owner, chat.meta.id, path || ".");
    } catch (e: any) {
        return `Error: ${e.message}`;
    }
});
