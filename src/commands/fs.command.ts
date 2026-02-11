import { commandManager } from "../commands";
import { FileSystem } from "../sandbox/filesystem";
import { ChannelManager } from "../channels";

// Commands
commandManager.register({
    name: "fs",
    description: "Manage filesystem in a workspace.",
    usage: "/fs mkdir [workspaceId] <path> | rm [workspaceId] <path> | read [workspaceId] <path> | write [workspaceId] <path> <content> | stat [workspaceId] <path> | ls [workspaceId] <path> | sendfile [workspaceId] <path> | nukeall [workspaceId]",
    handler: async (args, { user, chat }) => {
        const sub = args[0];
        if (!sub) return "Usage: /fs mkdir [workspaceId] <path> | rm [workspaceId] <path> | read [workspaceId] <path> | write [workspaceId] <path> <content> | stat [workspaceId] <path> | ls [workspaceId] [path] | sendfile [workspaceId] <path> | nukeall [workspaceId]";

        let workspaceId = args[1];
        let pathArg = args[2];

        // Heuristic to detect if workspaceId was skipped
        if (["ls", "read", "rm", "mkdir", "stat", "sendfile", "nukeall"].includes(sub)) {
            // If only 2 total args (/fs ls path), then args[1] is path
            // For nukeall, args[1] IS the workspaceId (optional)
            if (sub === "nukeall") {
                // /fs nukeall -> workspaceId = chat (default to chat if empty)
                // /fs nukeall mywork -> workspaceId = mywork
                if (args.length === 1) {
                    workspaceId = "chat";
                } else {
                    workspaceId = args[1];
                }
            } else if (args.length === 2) {
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
                case "sendfile":
                    if (!pathArg) return "Error: Missing path argument.";

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
                case "nukeall":
                    const confirm = workspaceId || "chat";
                    await FileSystem.rm(userId, confirm, ".", chat.meta.id);
                    await FileSystem.mkdir(userId, confirm, ".", chat.meta.id);
                    return `Workspace '${confirm}' has been nuked (all files deleted).`;
                default:
                    return "Unknown sub-command.";
            }
        } catch (e: any) {
            return `FS Error: ${e.message}`;
        }
    }
});
