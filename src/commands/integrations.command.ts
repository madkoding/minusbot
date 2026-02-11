import { commandManager } from "./command-manager";
import { IntegrationManager } from "../integrations/integration-manager";
import { getUserIntegrationConfigFile } from "../config";
import { secrets } from "../secrets";
import fs from "node:fs/promises";
import path from "node:path";

// /integrations
commandManager.register({
    name: "integrations",
    description: "Manage your integrations.",
    usage: "/integrations list | /integrations config <id> | /integrations config <id> set <key> <value>",
    handler: async (args, { user }) => {
        const sub = args[0]?.toLowerCase();

        if (sub === "list") {
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

        if (sub === "config" && args[1]) {
            const integrationId = args[1];
            const IntClass = IntegrationManager.AVAILABLE_INTEGRATIONS.find((c: any) => c.ID === integrationId);

            if (!IntClass) {
                return `Integration '${integrationId}' not found. Use /integrations list to see available integrations.`;
            }

            const instance = new IntClass(user, {});
            const schema = instance.schema;

            // If no more args, show config
            if (args.length === 2) {
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

            // Set a value
            if (args[2] === "set" && args[3]) {
                const key = args[3];
                const value = args.slice(4).join(" ");

                if (!value) {
                    return "Error: Value is required.";
                }

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

                // Load current config
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

                // Save config
                await fs.mkdir(path.dirname(configPath), { recursive: true });
                await fs.writeFile(configPath, JSON.stringify(config, null, 4), "utf-8");

                // Reload integration
                await IntegrationManager.reloadUser(user.id);

                return `Setting '${key}' updated for integration '${integrationId}'. Integration reloaded.`;
            }

            return "Usage: /integrations config <id> | /integrations config <id> set <key> <value>";
        }

        return "Usage: /integrations list | /integrations config <id> | /integrations config <id> set <key> <value>";
    }
});
