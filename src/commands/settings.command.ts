import { commandManager } from "./command-manager";
import {
    getUserSettings,
    getUserSettingsFile,
    getGlobalSettings,
    GLOBAL_SETTINGS_FILE,
    getSystemSettings,
    SYSTEM_SETTINGS_FILE
} from "../config";
import fs from "node:fs/promises";
import path from "node:path";

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
