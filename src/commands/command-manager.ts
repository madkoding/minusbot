import { type User, type Role } from "../data/users";
import { type Chat } from "../data/storage";

export interface CommandInfo {
    name: string;
    description: string;
    usage: string;
    needRole?: Role;
    handler: (args: string[], context: { user: User, chat: Chat }) => Promise<string>;
}

export class CommandManager {
    private commands: Map<string, CommandInfo> = new Map();

    register(info: CommandInfo) {
        this.commands.set(info.name.toLowerCase(), info);
    }

    async handle(input: string, user: User, chat: Chat): Promise<string | null> {
        if (!input.startsWith("/")) return null;

        const parts = input.slice(1).trim().split(/\s+/);
        const commandName = parts[0]?.toLowerCase();
        const args = parts.slice(1);

        if (!commandName) return null;

        const cmd = this.commands.get(commandName);
        if (!cmd) {
            return `Unknown command: /${commandName}. Type /help for assistance.`;
        }

        // Role check
        if (cmd.needRole) {
            if (cmd.needRole === "root" && user.role !== "root") {
                return "Error: This command requires 'root' privileges.";
            }
            if (cmd.needRole === "admin" && (user.role !== "admin" && user.role !== "root")) {
                return "Error: This command requires 'admin' privileges.";
            }
        }

        try {
            return await cmd.handler(args, { user, chat });
        } catch (e: any) {
            return `Error: ${e.message}`;
        }
    }

    getCommands(): CommandInfo[] {
        return Array.from(this.commands.values());
    }

    getCommand(name: string): CommandInfo | undefined {
        return this.commands.get(name.toLowerCase());
    }
}

export const commandManager = new CommandManager();
