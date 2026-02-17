import { commandManager } from "../commands";
import { FileSystem } from "../sandbox/filesystem";
import { ChannelManager } from "../channels";

commandManager.register({
    name: "fs",
    description: "Manage filesystem in a workspace",
    subs: [
        {
            name: "ls",
            description: "List files in a directory",
            args: [
                {
                    name: "workspace",
                    description: "Workspace ID (default: chat)",
                    type: "string",
                    required: false
                },
                {
                    name: "path",
                    description: "Path to list (default: .)",
                    type: "string",
                    required: false
                }
            ],
            handler: async (args, { user, chat }) => {
                const workspaceId = args[0] || "chat";
                const pathArg = args[1] || ".";
                return await FileSystem.ls(user.id, workspaceId, pathArg, chat.meta.id);
            }
        },
        {
            name: "mkdir",
            description: "Create a directory",
            args: [
                {
                    name: "path",
                    description: "Path to create",
                    type: "string",
                    required: true
                },
                {
                    name: "workspace",
                    description: "Workspace ID (default: chat)",
                    type: "string",
                    required: false
                }
            ],
            handler: async (args, { user, chat }) => {
                const pathArg = args[0];
                const workspaceId = args[1] || "chat";
                if (!pathArg) return "Error: Missing path argument.";
                return await FileSystem.mkdir(user.id, workspaceId, pathArg, chat.meta.id);
            }
        },
        {
            name: "rm",
            description: "Remove a file or directory",
            args: [
                {
                    name: "path",
                    description: "Path to remove",
                    type: "string",
                    required: true
                },
                {
                    name: "workspace",
                    description: "Workspace ID (default: chat)",
                    type: "string",
                    required: false
                }
            ],
            handler: async (args, { user, chat }) => {
                const pathArg = args[0];
                const workspaceId = args[1] || "chat";
                if (!pathArg) return "Error: Missing path argument.";
                return await FileSystem.rm(user.id, workspaceId, pathArg, chat.meta.id);
            }
        },
        {
            name: "read",
            description: "Read a file's contents",
            args: [
                {
                    name: "path",
                    description: "Path to read",
                    type: "string",
                    required: true
                },
                {
                    name: "workspace",
                    description: "Workspace ID (default: chat)",
                    type: "string",
                    required: false
                }
            ],
            handler: async (args, { user, chat }) => {
                const pathArg = args[0];
                const workspaceId = args[1] || "chat";
                if (!pathArg) return "Error: Missing path argument.";
                return await FileSystem.read(user.id, workspaceId, pathArg, chat.meta.id);
            }
        },
        {
            name: "write",
            description: "Write content to a file",
            args: [
                {
                    name: "path",
                    description: "Path to write",
                    type: "string",
                    required: true
                },
                {
                    name: "content",
                    description: "Content to write",
                    type: "string",
                    required: true
                },
                {
                    name: "workspace",
                    description: "Workspace ID (default: chat)",
                    type: "string",
                    required: false
                }
            ],
            handler: async (args, { user, chat }) => {
                const pathArg = args[0];
                const content = args[1];
                const workspaceId = args[2] || "chat";

                if (!pathArg || !content) return "Error: Missing path or content argument.";
                return await FileSystem.write(user.id, workspaceId, pathArg, content, chat.meta.id);
            }
        },
        {
            name: "stat",
            description: "Get file/directory information",
            args: [
                {
                    name: "path",
                    description: "Path to stat",
                    type: "string",
                    required: true
                },
                {
                    name: "workspace",
                    description: "Workspace ID (default: chat)",
                    type: "string",
                    required: false
                }
            ],
            handler: async (args, { user, chat }) => {
                const pathArg = args[0];
                const workspaceId = args[1] || "chat";
                if (!pathArg) return "Error: Missing path argument.";
                return await FileSystem.stat(user.id, workspaceId, pathArg, chat.meta.id);
            }
        },
        {
            name: "sendfile",
            description: "Send a file to the active channel",
            args: [
                {
                    name: "path",
                    description: "Path to send",
                    type: "string",
                    required: true
                },
                {
                    name: "workspace",
                    description: "Workspace ID (default: chat)",
                    type: "string",
                    required: false
                }
            ],
            handler: async (args, { user, chat }) => {
                const pathArg = args[0];
                const workspaceId = args[1] || "chat";
                if (!pathArg) return "Error: Missing path argument.";
                // ... rest of handler

                const lastChannelId = chat.meta.last_channel;
                if (!lastChannelId) {
                    return "Error: No active channel found for this chat. Cannot send file.";
                }

                const channel = ChannelManager.getInstance(chat.meta.owner, lastChannelId);
                if (!channel) {
                    return `Error: Active channel '${lastChannelId}' not found or disabled.`;
                }

                const resolvedPath = await FileSystem.resolvePath(chat.meta.owner, workspaceId, pathArg, chat.meta.id);
                await channel.sendFile(resolvedPath);
                return `File sent via ${channel.name}.`;
            }
        },
        {
            name: "nukeall",
            description: "Delete all files in a workspace",
            args: [
                {
                    name: "workspace",
                    description: "Workspace ID to nuke (default: chat)",
                    type: "string",
                    required: false
                }
            ],
            handler: async (args, { user, chat }) => {
                const workspaceId = args[0] || "chat";
                await FileSystem.rm(user.id, workspaceId, ".", chat.meta.id);
                await FileSystem.mkdir(user.id, workspaceId, ".", chat.meta.id);
                return `Workspace '${workspaceId}' has been nuked (all files deleted).`;
            }
        }
    ]
});
