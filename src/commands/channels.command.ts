import { commandManager } from "./command-manager";
import { ChannelManager } from "../channels";
import { getUserChannelConfigFile } from "../data/storage";
import fs from "node:fs/promises";
import path from "node:path";

// /channels
commandManager.register({
    name: "channels",
    description: "Manage your communication channels.",
    usage: "/channels list | /channels config <id> | /channels config <id> set <key> <value> | /channels config <id> enable | /channels config <id> disable",
    handler: async (args, { user }) => {
        const sub = args[0]?.toLowerCase();

        if (sub === "list") {
            const available = ChannelManager.getAvailableChannels();
            const instances = ChannelManager.getInstances(user.id);
            const activeIds = new Set(Array.from(instances.keys()));

            const lines = available.map((schema: any) => {
                const status = activeIds.has(schema.id) ? "✅" : "⚪";
                return `  ${status} ${schema.name} (${schema.id})`;
            });

            return `Available Channels:\n${lines.join("\n")}\n\nUse /channels config <id> to configure.`;
        }

        if (sub === "config" && args[1]) {
            const channelId = args[1];
            const schemas = ChannelManager.getAvailableChannels();
            const schema = schemas.find((s: any) => s.id === channelId);

            if (!schema) {
                return `Channel '${channelId}' not found. Use /channels list to see available channels.`;
            }

            // If no more args, show config
            if (args.length === 2) {
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

            // Enable/Disable
            if (args[2] === "enable" || args[2] === "disable") {
                const configPath = getUserChannelConfigFile(user.id, channelId);
                let config: any = { enabled: false, settings: {}, secrets: {} };
                try {
                    const content = await fs.readFile(configPath, "utf-8");
                    config = JSON.parse(content);
                } catch {
                    config = { enabled: false, settings: {}, secrets: {} };
                }

                config.enabled = args[2] === "enable";

                await fs.mkdir(path.dirname(configPath), { recursive: true });
                await fs.writeFile(configPath, JSON.stringify(config, null, 4), "utf-8");

                await ChannelManager.reloadUser(user.id);

                return `Channel '${channelId}' ${config.enabled ? "enabled" : "disabled"}. Channel reloaded.`;
            }

            // Set a value
            if (args[2] === "set" && args[3]) {
                const key = args[3];
                const value = args.slice(4).join(" ");

                if (!value) {
                    return "Error: Value is required.";
                }

                // Check if it's a field
                const field = schema.fields.find((f: any) => f.id === key);
                if (!field) {
                    return `Error: Key '${key}' not found in channel schema. Available keys: ${schema.fields.map((f: any) => f.id).join(", ")}`;
                }

                // Load current config
                const configPath = getUserChannelConfigFile(user.id, channelId);
                let config: any = { enabled: false, settings: {}, secrets: {} };
                try {
                    const content = await fs.readFile(configPath, "utf-8");
                    config = JSON.parse(content);
                } catch {
                    config = { enabled: false, settings: {}, secrets: {} };
                }

                // Process value based on type
                let processedValue: any = value;
                if (field.type === "number") {
                    processedValue = Number(value);
                } else if (field.type === "boolean") {
                    processedValue = value === "true" || value === "1";
                } else if (field.type === "string-array") {
                    processedValue = value.split(",").map((s: string) => s.trim()).filter(Boolean);
                }

                // Store in appropriate location
                if (field.secret) {
                    config.secrets[key] = processedValue;
                } else {
                    config.settings[key] = processedValue;
                }

                // Save config
                await fs.mkdir(path.dirname(configPath), { recursive: true });
                await fs.writeFile(configPath, JSON.stringify(config, null, 4), "utf-8");

                // Reload channel
                await ChannelManager.reloadUser(user.id);

                return `Setting '${key}' updated for channel '${channelId}'. Channel reloaded.`;
            }

            return "Usage: /channels config <id> | /channels config <id> set <key> <value> | /channels config <id> enable|disable";
        }

        return "Usage: /channels list | /channels config <id> | /channels config <id> set <key> <value> | /channels config <id> enable|disable";
    }
});
