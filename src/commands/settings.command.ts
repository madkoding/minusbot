import { commandManager } from "./command-manager";
import {
    getUserSettings,
    getUserSettingsFile,
    getGlobalSettings,
    GLOBAL_SETTINGS_FILE,
    getSystemSettings,
    SYSTEM_SETTINGS_FILE
} from "../data/storage";
import fs from "node:fs/promises";
import path from "node:path";

// /settings
commandManager.register({
    name: "settings",
    description: "Manage your personal bot settings",
    subs: [
        {
            name: "list",
            description: "List all your personal settings",
            handler: async (args, { user }) => {
                const settings = await getUserSettings(user.id);
                const lines = Object.entries(settings).map(([k, v]) => `  • ${k}: ${v}`);
                return `Your Settings:\n${lines.join("\n")}`;
            }
        },
        {
            name: "set",
            description: "Set a personal setting value",
            args: [
                {
                    name: "key",
                    description: "Setting key to update",
                    type: "string",
                    required: true
                },
                {
                    name: "value",
                    description: "New value for the setting",
                    type: "string",
                    required: true
                }
            ],
            handler: async (args, { user }) => {
                const key = args[0];
                let value: any = args[1];

                if (!key || value === undefined) {
                    return "Error: key and value are required";
                }

                // Type conversion
                if (value === "true") value = true;
                if (value === "false") value = false;
                if (!isNaN(Number(value)) && typeof value === 'string') value = Number(value);

                const file = getUserSettingsFile(user.id);
                const current = await fs.readFile(file, "utf-8").then(c => JSON.parse(c)).catch(() => ({}));
                current[key] = value;
                await fs.mkdir(path.dirname(file), { recursive: true });
                await fs.writeFile(file, JSON.stringify(current, null, 4), "utf-8");
                return `Personal setting '${key}' updated to '${value}'.`;
            }
        }
    ]
});

// /gsettings
commandManager.register({
    name: "gsettings",
    description: "Manage default/global bot settings",
    needRole: "admin",
    subs: [
        {
            name: "list",
            description: "List all global settings",
            handler: async () => {
                const settings = await getGlobalSettings();
                return `Global Settings:\n${Object.entries(settings).map(([k, v]) => `  • ${k}: ${v}`).join("\n")}`;
            }
        },
        {
            name: "set",
            description: "Set a global setting value",
            args: [
                {
                    name: "key",
                    description: "Setting key to update",
                    type: "string",
                    required: true
                },
                {
                    name: "value",
                    description: "New value for the setting",
                    type: "string",
                    required: true
                }
            ],
            handler: async (args) => {
                const key = args[0];
                const value = args[1];

                if (!key || value === undefined) {
                    return "Error: key and value are required";
                }

                const current = await fs.readFile(GLOBAL_SETTINGS_FILE, "utf-8").then(c => JSON.parse(c)).catch(() => ({}));
                current[key] = value;
                await fs.writeFile(GLOBAL_SETTINGS_FILE, JSON.stringify(current, null, 4), "utf-8");
                return `Global setting '${key}' updated.`;
            }
        }
    ]
});

// /sys
commandManager.register({
    name: "sys",
    description: "Configure system-level settings",
    needRole: "root",
    subs: [
        {
            name: "list",
            description: "List all system settings",
            handler: async () => {
                const settings = await getSystemSettings();
                return `System Settings:\n${Object.entries(settings).map(([k, v]) => `  • ${k}: ${v}`).join("\n")}`;
            }
        },
        {
            name: "set",
            description: "Set a system setting value",
            args: [
                {
                    name: "key",
                    description: "Setting key to update",
                    type: "string",
                    required: true
                },
                {
                    name: "value",
                    description: "New value for the setting",
                    type: "string",
                    required: true
                }
            ],
            handler: async (args) => {
                const key = args[0];
                const value = args[1];

                if (!key || !value) {
                    return "Error: key and value are required";
                }

                const current = JSON.parse(await fs.readFile(SYSTEM_SETTINGS_FILE, "utf-8").catch(() => "{}"));
                current[key] = Number(value) || value;
                await fs.writeFile(SYSTEM_SETTINGS_FILE, JSON.stringify(current, null, 4), "utf-8");
                return `System setting '${key}' updated. Restart required.`;
            }
        }
    ]
});
