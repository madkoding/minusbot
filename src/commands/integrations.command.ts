import { commandManager } from "./command-manager";
import { IntegrationManager } from "../integrations/integration-manager";
import { getUserIntegrationConfigFile } from "../data/storage";
import { secrets } from "../secrets";
import fs from "node:fs/promises";
import path from "node:path";

commandManager.register({
    name: "integrations",
    description: "Manage your integrations",
    subs: [
        {
            name: "list",
            description: "List all available integrations",
            handler: async (args, { user }) => {
                const available = IntegrationManager.AVAILABLE_INTEGRATIONS;
                const instances = IntegrationManager.getInstances(user.id);
                const activeIds = new Set(instances.map(i => i.id));

                const lines = available.map((IntClass: any) => {
                    const id = IntClass.ID || "unknown";
                    const instance = new IntClass(user, {});
                    const status = activeIds.has(id) ? "✅" : "⚪";
                    return `  ${status} ${instance.name} (${id})`;
                });

                return `Available Integrations:\n${lines.join("\n")}\n\nUse /integrations config <id> to configure.`;
            }
        },
        {
            name: "config",
            description: "Configure a specific integration",
            args: [
                {
                    name: "integration_id",
                    description: "The integration ID to configure",
                    type: "string",
                    required: true
                }
            ],
            subs: [
                {
                    name: "show",
                    description: "Show integration configuration",
                    handler: async (args, { user }) => {
                        const integrationId = args[0];
                        if (!integrationId) return "Error: integration_id is required";

                        const IntClass = IntegrationManager.AVAILABLE_INTEGRATIONS.find((c: any) => c.ID === integrationId);
                        if (!IntClass) {
                            return `Integration '${integrationId}' not found. Use /integrations list to see available integrations.`;
                        }

                        const instance = new IntClass(user, {});
                        const schema = instance.schema;

                        const configPath = getUserIntegrationConfigFile(user.id, integrationId);
                        let config = {};
                        try {
                            const content = await fs.readFile(configPath, "utf-8");
                            config = JSON.parse(content);
                        } catch {
                            config = {};
                        }

                        const settingsLines = schema.fields.map((f: any) => {
                            const val = (config as any)[f.id] || "(not set)";
                            return `  • ${f.label} (${f.id}): ${val}`;
                        });

                        const vaultLines: string[] = [];
                        if (schema.vaultKeys && schema.vaultKeys.length > 0) {
                            const vaultId = schema.vaultId || `integration-${integrationId}`;
                            const vault = await secrets.userVault(user.id, vaultId);
                            const vaultKeysList = vault.listKeys();

                            vaultLines.push("\nSecrets:");
                            schema.vaultKeys.forEach((key: string) => {
                                const exists = vaultKeysList.includes(key);
                                vaultLines.push(`  • ${key}: ${exists ? "✅ Set" : "⚪ Not set"}`);
                            });
                        }

                        return `Integration: ${schema.name}\n\nSettings:\n${settingsLines.join("\n")}${vaultLines.join("\n")}\n\nUse /integrations config ${integrationId} set <key> <value> to update.`;
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
                        const integrationId = args[0];
                        const key = args[1];
                        const value = args.slice(2).join(" ");

                        if (!integrationId || !key || !value) {
                            return "Error: integration_id, key, and value are required";
                        }

                        const IntClass = IntegrationManager.AVAILABLE_INTEGRATIONS.find((c: any) => c.ID === integrationId);
                        if (!IntClass) {
                            return `Integration '${integrationId}' not found.`;
                        }

                        const instance = new IntClass(user, {});
                        const schema = instance.schema;

                        // Check if it's a vault key
                        if (schema.vaultKeys && schema.vaultKeys.includes(key)) {
                            const vaultId = schema.vaultId || `integration-${integrationId}`;
                            const vault = await secrets.userVault(user.id, vaultId);
                            await vault.set(key, value);
                            return `Secret '${key}' updated for integration '${integrationId}'.`;
                        }

                        // Check if it's a settings field
                        const field = schema.fields.find((f: any) => f.id === key);
                        if (!field) {
                            return `Error: Key '${key}' not found in integration schema. Available keys: ${schema.fields.map((f: any) => f.id).join(", ")}${schema.vaultKeys ? ", " + schema.vaultKeys.join(", ") : ""}`;
                        }

                        const configPath = getUserIntegrationConfigFile(user.id, integrationId);
                        let config: any = {};
                        try {
                            const content = await fs.readFile(configPath, "utf-8");
                            config = JSON.parse(content);
                        } catch {
                            config = {};
                        }

                        // Process value based on type
                        if (field.type === "number") {
                            config[key] = Number(value);
                        } else if (field.type === "boolean") {
                            config[key] = value === "true" || value === "1";
                        } else if (field.type === "string-array") {
                            config[key] = value.split(",").map((s: string) => s.trim()).filter(Boolean);
                        } else {
                            config[key] = value;
                        }

                        await fs.mkdir(path.dirname(configPath), { recursive: true });
                        await fs.writeFile(configPath, JSON.stringify(config, null, 4), "utf-8");
                        await IntegrationManager.reloadUser(user.id);

                        return `Setting '${key}' updated for integration '${integrationId}'. Integration reloaded.`;
                    }
                }
            ],
            handler: async (args, { user }) => {
                // Default handler when no subcommand is provided - show config
                const integrationId = args[0];
                if (!integrationId) {
                    return "Usage: /integrations config <integration_id> <subcommand>\nSubcommands: show, set";
                }

                const IntClass = IntegrationManager.AVAILABLE_INTEGRATIONS.find((c: any) => c.ID === integrationId);
                if (!IntClass) {
                    return `Integration '${integrationId}' not found. Use /integrations list to see available integrations.`;
                }

                const instance = new IntClass(user, {});
                const schema = instance.schema;

                const configPath = getUserIntegrationConfigFile(user.id, integrationId);
                let config = {};
                try {
                    const content = await fs.readFile(configPath, "utf-8");
                    config = JSON.parse(content);
                } catch {
                    config = {};
                }

                const settingsLines = schema.fields.map((f: any) => {
                    const val = (config as any)[f.id] || "(not set)";
                    return `  • ${f.label} (${f.id}): ${val}`;
                });

                const vaultLines: string[] = [];
                if (schema.vaultKeys && schema.vaultKeys.length > 0) {
                    const vaultId = schema.vaultId || `integration-${integrationId}`;
                    const vault = await secrets.userVault(user.id, vaultId);
                    const vaultKeysList = vault.listKeys();

                    vaultLines.push("\nSecrets:");
                    schema.vaultKeys.forEach((key: string) => {
                        const exists = vaultKeysList.includes(key);
                        vaultLines.push(`  • ${key}: ${exists ? "✅ Set" : "⚪ Not set"}`);
                    });
                }

                return `Integration: ${schema.name}\n\nSettings:\n${settingsLines.join("\n")}${vaultLines.join("\n")}\n\nUse /integrations config ${integrationId} set <key> <value> to update.`;
            }
        }
    ]
});
