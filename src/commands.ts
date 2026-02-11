import { secrets } from "./secrets";
import {
    getUserSettingsFile,
    getUserSettings,
    GLOBAL_SETTINGS_FILE,
    getGlobalSettings,
    SYSTEM_SETTINGS_FILE,
    getSystemSettings,
    getUserDir,
    SHARED_SKILLS_DIR,
    SHARED_SECRETS_DIR
} from "./config";
import fs from "node:fs/promises";
import path from "node:path";
import { CronManager, type CronJob } from "./cron";
import { SkillManager } from "./skills";
import { StatsManager } from "./stats";
import { Storage, type Chat } from "./storage";
import bcrypt from "bcrypt";

import { UserManager, type Role, type User } from "./users";

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

// --- Per-User Commands ---

// /env
commandManager.register({
    name: "env",
    description: "Manage your personal environment secrets.",
    usage: "/env list <vault> | /env set <vault> <key> <value> | /env del <vault> <key>",
    handler: async (args, { user }) => {
        const sub = args[0];
        const vaultName = args[1];
        if (sub === "list" && vaultName) {
            const vault = await secrets.userVault(user.id, vaultName);
            const keys = vault.listKeys();
            return `Personal vault '${vaultName}':\n  • ${keys.join("\n  • ")}`;
        }
        if (sub === "set" && vaultName && args[2]) {
            const vault = await secrets.userVault(user.id, vaultName);
            const key = args[2];
            const value = args.slice(3).join(" ");
            await vault.set(key, value);
            return `Set '${key}' in your personal vault '${vaultName}'.`;
        }
        if ((sub === "del" || sub === "delete") && vaultName && args[2]) {
            const vault = await secrets.userVault(user.id, vaultName);
            await vault.delete(args[2]);
            return `Deleted '${args[2]}' from your personal vault '${vaultName}'.`;
        }
        return "Usage: /env list <vault> | /env set <vault> <key> <value> | /env del <vault> <key>";
    }
});

// /settings
commandManager.register({
    name: "settings",
    description: "Manage your personal bot settings.",
    usage: "/settings list | /settings set <key> <value>",
    handler: async (args, { user }) => {
        const sub = args[0];
        const settings = await getUserSettings(user.id);
        const file = getUserSettingsFile(user.id);

        if (sub === "list") {
            const lines = Object.entries(settings).map(([k, v]) => `  • ${k}: ${v}`);
            return `Your Settings:\n${lines.join("\n")}`;
        }

        if (sub === "set" && args[1] && args[2] !== undefined) {
            const key = args[1];
            let value: any = args[2];

            // Allow override of any setting
            if (value === "true") value = true;
            if (value === "false") value = false;
            if (!isNaN(Number(value)) && typeof value === 'string') value = Number(value);

            const current = await fs.readFile(file, "utf-8").then(c => JSON.parse(c)).catch(() => ({}));
            current[key] = value;
            await fs.mkdir(path.dirname(file), { recursive: true });
            await fs.writeFile(file, JSON.stringify(current, null, 4), "utf-8");
            return `Personal setting '${key}' updated to '${value}'.`;
        }
        return "Usage: /settings list | /settings set <key> <value>";
    }
});

// /skills
commandManager.register({
    name: "skills",
    description: "Toggle personal skill overrides.",
    usage: "/skills list | /skills toggle <id>",
    handler: async (args, { user }) => {
        const sub = args[0]?.toLowerCase();
        const settings = await getUserSettings(user.id);
        const file = getUserSettingsFile(user.id);

        if (sub === "list") {
            const skills = await SkillManager.listSkills(user.id);
            return `Available Skills:\n${skills.map(s => `  • [${s.enabled ? '✔' : '✖'}] ${s.id} ${s.isGlobal ? '(shared)' : ''}`).join("\n")}`;
        }

        if (sub === "toggle" && args[1]) {
            const id = args[1];
            const disabled = settings.disabled_skills || [];
            let newDisabled;
            if (disabled.includes(id)) {
                newDisabled = disabled.filter(d => d !== id);
            } else {
                newDisabled = [...disabled, id];
            }

            const current = await fs.readFile(file, "utf-8").then(c => JSON.parse(c)).catch(() => ({}));
            current.disabled_skills = newDisabled;
            await fs.mkdir(path.dirname(file), { recursive: true });
            await fs.writeFile(file, JSON.stringify(current, null, 4), "utf-8");
            return `Skill '${id}' ${newDisabled.includes(id) ? 'disabled' : 'enabled'} for you.`;
        }
        return "Usage: /skills list | /skills toggle <id>";
    }
});

// /cron
commandManager.register({
    name: "cron",
    description: "Manage your personal scheduled tasks.",
    usage: "/cron list | /cron cancel <id>",
    handler: async (args, { user }) => {
        const sub = args[0]?.toLowerCase();
        if (sub === "list") {
            const jobs = await CronManager.list(user.id);
            if (jobs.length === 0) return "No personal cronjobs.";
            return `Your Cronjobs:\n${jobs.map(j => `  • [${j.id}] ${j.triggerAt} - ${j.prompt.substring(0, 30)}...`).join("\n")}`;
        }
        if (sub === "cancel" && args[1]) {
            await CronManager.cancel(user.id, args[1]);
            return `Cancelled your cronjob '${args[1]}'.`;
        }
        return "Usage: /cron list | /cron cancel <id>";
    }
});

// /stats
commandManager.register({
    name: "stats",
    description: "View your personal usage statistics.",
    usage: "/stats [date]",
    handler: async (args, { user }) => {
        const stats = await StatsManager.getStats(user.id, args[0]);
        return `Your Stats:\n  • Chats: ${stats.chats_created}\n  • Messages: ${stats.messages_sent}\n  • Tokens: ${stats.tokens_input + stats.tokens_output}`;
    }
});

// --- Global Commands (Admin/Root only) ---

// /genv
commandManager.register({
    name: "genv",
    description: "Manage shared/global environment secrets.",
    usage: "/genv list <vault> | /genv set <vault> <key> <value> | /genv del <vault> <key>",
    needRole: "admin",
    handler: async (args) => {
        const sub = args[0];
        const vaultName = args[1];
        if (sub === "list" && vaultName) {
            const vault = await secrets.globalVault(vaultName);
            return `Global vault '${vaultName}':\n  • ${vault.listKeys().join("\n  • ")}`;
        }
        if (sub === "set" && vaultName && args[2]) {
            const vault = await secrets.globalVault(vaultName);
            await vault.set(args[2], args.slice(3).join(" "));
            return `Set '${args[2]}' in global vault '${vaultName}'.`;
        }
        if ((sub === "del" || sub === "delete") && vaultName && args[2]) {
            const vault = await secrets.globalVault(vaultName);
            await vault.delete(args[2]);
            return `Deleted '${args[2]}' from global vault '${vaultName}'.`;
        }
        return "Usage: /genv list <vault> | /genv set <vault> <key> <value> | /genv del <vault> <key>";
    }
});

// /gsettings
commandManager.register({
    name: "gsettings",
    description: "Manage default/global bot settings.",
    usage: "/gsettings list | /gsettings set <key> <value>",
    needRole: "admin",
    handler: async (args) => {
        const sub = args[0];
        const settings = await getGlobalSettings();
        if (sub === "list") {
            return `Global Settings:\n${Object.entries(settings).map(([k, v]) => `  • ${k}: ${v}`).join("\n")}`;
        }
        if (sub === "set" && args[1] && args[2] !== undefined) {
            const current = await fs.readFile(GLOBAL_SETTINGS_FILE, "utf-8").then(c => JSON.parse(c)).catch(() => ({}));
            current[args[1]] = args[2]; // Simplified type handling for brevity
            await fs.writeFile(GLOBAL_SETTINGS_FILE, JSON.stringify(current, null, 4), "utf-8");
            return `Global setting '${args[1]}' updated.`;
        }
        return "Usage: /gsettings list | /gsettings set <key> <value>";
    }
});

// /gstats
commandManager.register({
    name: "gstats",
    description: "View global system usage statistics.",
    usage: "/gstats [date]",
    needRole: "admin",
    handler: async (args) => {
        const stats = await StatsManager.getStats(undefined, args[0]);
        return `Global Stats:\n  • Chats: ${stats.chats_created}\n  • Messages: ${stats.messages_sent}\n  • Tokens: ${stats.tokens_input + stats.tokens_output}`;
    }
});

// /sys
commandManager.register({
    name: "sys",
    description: "Configure system-level settings (port, etc).",
    usage: "/sys list | /sys set <key> <value>",
    needRole: "root",
    handler: async (args) => {
        const sub = args[0];
        const settings = await getSystemSettings();
        if (sub === "list") {
            return `System Settings:\n${Object.entries(settings).map(([k, v]) => `  • ${k}: ${v}`).join("\n")}`;
        }
        if (sub === "set" && args[1] && args[2]) {
            const current = JSON.parse(await fs.readFile(SYSTEM_SETTINGS_FILE, "utf-8").catch(() => "{}"));
            current[args[1]] = Number(args[2]) || args[2];
            await fs.writeFile(SYSTEM_SETTINGS_FILE, JSON.stringify(current, null, 4), "utf-8");
            return `System setting '${args[1]}' updated. Restart required.`;
        }
        return "Usage: /sys list | /sys set <key> <value>";
    }
});

// /help, /users, etc. (Mostly similar but updated for new structure)
commandManager.register({
    name: "users",
    description: "Manage system users.",
    usage: "/users list | add <u-n> <pass> | role <u-n> <role> | remove <u-n>",
    needRole: "admin",
    handler: async (args, { user }) => {
        const sub = args[0]?.toLowerCase();
        if (sub === "list") {
            return `Users:\n${UserManager.getUsers().map(u => `  • ${u.username} [${u.role}]`).join("\n")}`;
        }
        if (sub === "add" && args[1] && args[2]) {
            await UserManager.createUser(args[1], args[2], "user");
            return `User '${args[1]}' created.`;
        }
        if (sub === "remove" && args[1]) {
            const target = UserManager.getUserByUsername(args[1]);
            if (!target) return "User not found.";
            await UserManager.deleteUser(target.id);
            return `User '${args[1]}' removed.`;
        }
        return "Usage: /users list | add <u-n> <pass> | role <u-n> <role> | remove <u-n>";
    }
});

commandManager.register({
    name: "help",
    description: "Show list of commands.",
    usage: "/help",
    handler: async (args) => {
        return `Available Commands:\n${commandManager.getCommands().map(c => `  • /${c.name.padEnd(10)} - ${c.description}`).join("\n")}`;
    }
});
