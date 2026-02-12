import { commandManager } from "./command-manager";
import { ChannelManager } from "../channels";
import { getUserChannelConfigFile } from "../data/storage";
import fs from "node:fs/promises";
import path from "node:path";

commandManager.register({
    name: "channels",
    description: "Manage your communication channels",
    subs: [
        {
            name: "list",
            description: "List all available channels",
            handler: async (args, { user }) => {
                const available = ChannelManager.getAvailableChannels();
                const instances = ChannelManager.getInstances(user.id);
                const activeIds = new Set(Array.from(instances.keys()));

                const lines = available.map((schema: any) => {
                    const status = activeIds.has(schema.id) ? "✅" : "⚪";
                    return `  ${status} ${schema.name} (${schema.id})`;
                });

                return `Available Channels:\n${lines.join("\n")}\n\nUse /channels config <id> to configure.`;
            }
        },
        {
            name: "config",
            description: "Configure a specific channel",
            args: [
                {
                    name: "channel_id",
                    description: "The channel ID to configure",
                    type: "string",
                    required: true
                }
            ],
            subs: [
                {
                    name: "show",
                    description: "Show channel configuration",
                    handler: async (args, { user }) => {
                        const channelId = args[0];
                        if (!channelId) return "Error: channel_id is required";

                        const schemas = ChannelManager.getAvailableChannels();
                        const schema = schemas.find((s: any) => s.id === channelId);

                        if (!schema) {
                            return `Channel '${channelId}' not found. Use /channels list to see available channels.`;
                        }

                        const configPath = getUserChannelConfigFile(user.id, channelId);
                        let config: any = { enabled: false, settings: {}, secrets: {} };
                        try {
                            const content = await fs.readFile(configPath, "utf-8");
                            config = JSON.parse(content);
                        } catch {
                            config = { enabled: false, settings: {}, secrets: {} };
                        }

                        const statusLine = `Status: ${config.enabled ? "✅ Enabled" : "⚪ Disabled"}`;

                        const settingsLines = schema.fields.filter((f: any) => !f.secret).map((f: any) => {
                            const val = config.settings[f.id] || "(not set)";
                            return `  • ${f.label} (${f.id}): ${val}`;
                        });

                        const secretLines = schema.fields.filter((f: any) => f.secret).map((f: any) => {
                            const exists = !!config.secrets[f.id];
                            return `  • ${f.label} (${f.id}): ${exists ? "✅ Set" : "⚪ Not set"}`;
                        });

                        let output = `Channel: ${schema.name}\n\n${statusLine}\n\nSettings:\n${settingsLines.join("\n")}`;
                        if (secretLines.length > 0) {
                            output += `\n\nSecrets:\n${secretLines.join("\n")}`;
                        }
                        output += `\n\nUse /channels config ${channelId} set <key> <value> to update.`;
                        output += `\nUse /channels config ${channelId} enable|disable to toggle.`;

                        return output;
                    }
                },
                {
                    name: "set",
                    description: "Set a configuration value",
                    args: [
                        {
                            name: "key",
                            description: "Configuration key to set",
                            type: "string",
                            required: true
                        },
                        {
                            name: "value",
                            description: "Value to set",
                            type: "string",
                            required: true
                        }
                    ],
                    handler: async (args, { user }) => {
                        // args[0] is channel_id from parent
                        // args[1] is key
                        // args[2+] is value
                        const channelId = args[0];
                        const key = args[1];
                        const value = args.slice(2).join(" ");

                        if (!channelId || !key || !value) {
                            return "Error: channel_id, key, and value are required";
                        }

                        const schemas = ChannelManager.getAvailableChannels();
                        const schema = schemas.find((s: any) => s.id === channelId);

                        if (!schema) {
                            return `Channel '${channelId}' not found.`;
                        }

                        const field = schema.fields.find((f: any) => f.id === key);
                        if (!field) {
                            return `Error: Key '${key}' not found in channel schema. Available keys: ${schema.fields.map((f: any) => f.id).join(", ")}`;
                        }

                        const configPath = getUserChannelConfigFile(user.id, channelId);
                        let config: any = { enabled: false, settings: {}, secrets: {} };
                        try {
                            const content = await fs.readFile(configPath, "utf-8");
                            config = JSON.parse(content);
                        } catch {
                            config = { enabled: false, settings: {}, secrets: {} };
                        }

                        let processedValue: any = value;
                        if (field.type === "number") {
                            processedValue = Number(value);
                        } else if (field.type === "boolean") {
                            processedValue = value === "true" || value === "1";
                        } else if (field.type === "string-array") {
                            processedValue = value.split(",").map((s: string) => s.trim()).filter(Boolean);
                        }

                        if (field.secret) {
                            config.secrets[key] = processedValue;
                        } else {
                            config.settings[key] = processedValue;
                        }

                        await fs.mkdir(path.dirname(configPath), { recursive: true });
                        await fs.writeFile(configPath, JSON.stringify(config, null, 4), "utf-8");
                        await ChannelManager.reloadUser(user.id);

                        return `Setting '${key}' updated for channel '${channelId}'. Channel reloaded.`;
                    }
                },
                {
                    name: "enable",
                    description: "Enable a channel",
                    handler: async (args, { user }) => {
                        const channelId = args[0];
                        if (!channelId) return "Error: channel_id is required";

                        const schemas = ChannelManager.getAvailableChannels();
                        const schema = schemas.find((s: any) => s.id === channelId);
                        if (!schema) return `Channel '${channelId}' not found.`;

                        const configPath = getUserChannelConfigFile(user.id, channelId);
                        let config: any = { enabled: false, settings: {}, secrets: {} };
                        try {
                            const content = await fs.readFile(configPath, "utf-8");
                            config = JSON.parse(content);
                        } catch {
                            config = { enabled: false, settings: {}, secrets: {} };
                        }

                        config.enabled = true;
                        await fs.mkdir(path.dirname(configPath), { recursive: true });
                        await fs.writeFile(configPath, JSON.stringify(config, null, 4), "utf-8");
                        await ChannelManager.reloadUser(user.id);

                        return `Channel '${channelId}' enabled. Channel reloaded.`;
                    }
                },
                {
                    name: "disable",
                    description: "Disable a channel",
                    handler: async (args, { user }) => {
                        const channelId = args[0];
                        if (!channelId) return "Error: channel_id is required";

                        const schemas = ChannelManager.getAvailableChannels();
                        const schema = schemas.find((s: any) => s.id === channelId);
                        if (!schema) return `Channel '${channelId}' not found.`;

                        const configPath = getUserChannelConfigFile(user.id, channelId);
                        let config: any = { enabled: false, settings: {}, secrets: {} };
                        try {
                            const content = await fs.readFile(configPath, "utf-8");
                            config = JSON.parse(content);
                        } catch {
                            config = { enabled: false, settings: {}, secrets: {} };
                        }

                        config.enabled = false;
                        await fs.mkdir(path.dirname(configPath), { recursive: true });
                        await fs.writeFile(configPath, JSON.stringify(config, null, 4), "utf-8");
                        await ChannelManager.reloadUser(user.id);

                        return `Channel '${channelId}' disabled. Channel reloaded.`;
                    }
                }
            ],
            handler: async (args, { user }) => {
                // Default handler when no subcommand is provided
                const channelId = args[0];
                if (!channelId) {
                    return "Usage: /channels config <channel_id> <subcommand>\nSubcommands: show, set, enable, disable";
                }

                // Show config by default
                const schemas = ChannelManager.getAvailableChannels();
                const schema = schemas.find((s: any) => s.id === channelId);

                if (!schema) {
                    return `Channel '${channelId}' not found. Use /channels list to see available channels.`;
                }

                const configPath = getUserChannelConfigFile(user.id, channelId);
                let config: any = { enabled: false, settings: {}, secrets: {} };
                try {
                    const content = await fs.readFile(configPath, "utf-8");
                    config = JSON.parse(content);
                } catch {
                    config = { enabled: false, settings: {}, secrets: {} };
                }

                const statusLine = `Status: ${config.enabled ? "✅ Enabled" : "⚪ Disabled"}`;

                const settingsLines = schema.fields.filter((f: any) => !f.secret).map((f: any) => {
                    const val = config.settings[f.id] || "(not set)";
                    return `  • ${f.label} (${f.id}): ${val}`;
                });

                const secretLines = schema.fields.filter((f: any) => f.secret).map((f: any) => {
                    const exists = !!config.secrets[f.id];
                    return `  • ${f.label} (${f.id}): ${exists ? "✅ Set" : "⚪ Not set"}`;
                });

                let output = `Channel: ${schema.name}\n\n${statusLine}\n\nSettings:\n${settingsLines.join("\n")}`;
                if (secretLines.length > 0) {
                    output += `\n\nSecrets:\n${secretLines.join("\n")}`;
                }
                output += `\n\nUse /channels config ${channelId} set <key> <value> to update.`;
                output += `\nUse /channels config ${channelId} enable|disable to toggle.`;

                return output;
            }
        }
    ]
});
