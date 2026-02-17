import { type User, type Role } from "../data/users";
import { type Chat } from "../data/storage";

export type CommandArgType = "string" | "number" | "boolean" | "string-array";

export interface CommandArg {
    name: string;
    description: string;
    type: CommandArgType;
    required?: boolean;
    choices?: { name: string; value: string | number }[];
}

export interface CommandInfo {
    name: string;
    description: string;
    usage?: string;
    needRole?: Role;
    args?: CommandArg[];
    subs?: CommandInfo[];
    handler?: (args: string[], context: { user: User, chat: Chat }) => Promise<string>;
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

        // Try to find subcommand handler
        const result = await this.executeCommand(cmd, args, { user, chat }, [commandName]);
        return result;
    }

    private async executeCommand(
        cmd: CommandInfo,
        args: string[],
        context: { user: User, chat: Chat },
        path: string[]
    ): Promise<string> {
        // Role check
        if (cmd.needRole) {
            if (cmd.needRole === "root" && context.user.role !== "root") {
                return "Error: This command requires 'root' privileges.";
            }
            if (cmd.needRole === "admin" && (context.user.role !== "admin" && context.user.role !== "root")) {
                return "Error: This command requires 'admin' privileges.";
            }
        }

        // Check if there are subcommands and first arg matches one
        if (cmd.subs && cmd.subs.length > 0 && args.length > 0) {
            const subName = args[0]?.toLowerCase();
            const subCmd = cmd.subs.find(s => s.name.toLowerCase() === subName);

            if (subCmd) {
                return await this.executeCommand(subCmd, args.slice(1), context, [...path?.concat(subName || [])]);
            }
        }

        // Execute handler if exists
        if (cmd.handler) {
            try {
                return await cmd.handler(args, context);
            } catch (e: any) {
                return `Error: ${e.message}`;
            }
        }

        // No handler and no matching subcommand
        if (cmd.subs && cmd.subs.length > 0) {
            const subNames = cmd.subs.map(s => s.name).join(", ");
            return `Available subcommands for /${path.join(" ")}: ${subNames}\n\nUsage: ${cmd.usage || `/${path.join(" ")} <subcommand>`}`;
        }

        return `Command /${path.join(" ")} has no handler defined.`;
    }

    getCommands(): CommandInfo[] {
        return Array.from(this.commands.values());
    }

    getCommand(name: string): CommandInfo | undefined {
        return this.commands.get(name.toLowerCase());
    }

    /**
     * Flatten command tree for Discord registration
     * Discord expects a flat list with subcommands nested in options
     */
    getDiscordCommands(): any[] {
        const result: any[] = [];

        for (const cmd of this.commands.values()) {
            const discordCmd: any = {
                name: cmd.name,
                description: cmd.description.substring(0, 100), // Discord limit
            };

            // If command has subcommands, add them as options
            if (cmd.subs && cmd.subs.length > 0) {
                discordCmd.options = cmd.subs.map(sub => this.buildDiscordSubcommand(sub, cmd.args));
            } else if (cmd.args && cmd.args.length > 0) {
                // Sort arguments: required first
                const sortedArgs = [...cmd.args].sort((a, b) => (b.required ? 1 : 0) - (a.required ? 1 : 0));
                discordCmd.options = sortedArgs.map(arg => this.buildDiscordOption(arg));
            }

            result.push(discordCmd);
        }

        return result;
    }

    private buildDiscordSubcommand(cmd: CommandInfo, parentArgs: CommandArg[] = []): any {
        const sub: any = {
            type: 1, // SUB_COMMAND
            name: cmd.name,
            description: (cmd.description || "No description").substring(0, 100),
        };

        // Combine parent arguments (inherited) with local arguments
        const allArgs = [...parentArgs, ...(cmd.args || [])];

        // Add arguments if present
        if (allArgs.length > 0) {
            // Sort arguments: required first
            const sortedArgs = allArgs.sort((a, b) => (b.required ? 1 : 0) - (a.required ? 1 : 0));
            sub.options = sortedArgs.map(arg => this.buildDiscordOption(arg));
        }

        // Discord doesn't support nested subcommands beyond 1 level easily
        // If there are subs, we use SUB_COMMAND_GROUP
        if (cmd.subs && cmd.subs.length > 0) {
            sub.type = 2; // SUB_COMMAND_GROUP
            sub.options = cmd.subs.map(s => this.buildDiscordSubcommand(s, allArgs));
        }

        return sub;
    }

    private buildDiscordOption(arg: CommandArg): any {
        const option: any = {
            name: arg.name,
            description: arg.description.substring(0, 100),
            type: this.getDiscordArgType(arg.type),
            required: arg.required || false,
        };

        if (arg.choices && arg.choices.length > 0) {
            option.choices = arg.choices;
        }

        return option;
    }

    private getDiscordArgType(type: CommandArgType): number {
        switch (type) {
            case "string": return 3;
            case "number": return 10; // INTEGER
            case "boolean": return 5;
            case "string-array": return 3; // Discord doesn't have array type, use string
            default: return 3;
        }
    }
}

export const commandManager = new CommandManager();
