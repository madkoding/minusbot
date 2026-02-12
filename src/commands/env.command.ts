import { commandManager } from "./command-manager";
import { secrets } from "../secrets";

// /env
commandManager.register({
    name: "env",
    description: "Manage your personal environment secrets",
    subs: [
        {
            name: "list",
            description: "List keys in a vault",
            args: [
                {
                    name: "vault",
                    description: "Vault name to list",
                    type: "string",
                    required: true
                }
            ],
            handler: async (args, { user }) => {
                const vaultName = args[0];
                if (!vaultName) return "Error: vault name is required";

                const vault = await secrets.userVault(user.id, vaultName);
                const keys = vault.listKeys();
                return `Personal vault '${vaultName}':\n  • ${keys.join("\n  • ")}`;
            }
        },
        {
            name: "set",
            description: "Set a secret value in a vault",
            args: [
                {
                    name: "vault",
                    description: "Vault name",
                    type: "string",
                    required: true
                },
                {
                    name: "key",
                    description: "Secret key",
                    type: "string",
                    required: true
                },
                {
                    name: "value",
                    description: "Secret value",
                    type: "string",
                    required: true
                }
            ],
            handler: async (args, { user }) => {
                const vaultName = args[0];
                const key = args[1];
                const value = args.slice(2).join(" ");

                if (!vaultName || !key || !value) {
                    return "Error: vault, key, and value are required";
                }

                const vault = await secrets.userVault(user.id, vaultName);
                await vault.set(key, value);
                return `Set '${key}' in your personal vault '${vaultName}'.`;
            }
        },
        {
            name: "del",
            description: "Delete a secret from a vault",
            args: [
                {
                    name: "vault",
                    description: "Vault name",
                    type: "string",
                    required: true
                },
                {
                    name: "key",
                    description: "Secret key to delete",
                    type: "string",
                    required: true
                }
            ],
            handler: async (args, { user }) => {
                const vaultName = args[0];
                const key = args[1];

                if (!vaultName || !key) {
                    return "Error: vault and key are required";
                }

                const vault = await secrets.userVault(user.id, vaultName);
                await vault.delete(key);
                return `Deleted '${key}' from your personal vault '${vaultName}'.`;
            }
        }
    ]
});

// /genv
commandManager.register({
    name: "genv",
    description: "Manage shared/global environment secrets",
    needRole: "admin",
    subs: [
        {
            name: "list",
            description: "List keys in a global vault",
            args: [
                {
                    name: "vault",
                    description: "Vault name to list",
                    type: "string",
                    required: true
                }
            ],
            handler: async (args) => {
                const vaultName = args[0];
                if (!vaultName) return "Error: vault name is required";

                const vault = await secrets.globalVault(vaultName);
                return `Global vault '${vaultName}':\n  • ${vault.listKeys().join("\n  • ")}`;
            }
        },
        {
            name: "set",
            description: "Set a secret value in a global vault",
            args: [
                {
                    name: "vault",
                    description: "Vault name",
                    type: "string",
                    required: true
                },
                {
                    name: "key",
                    description: "Secret key",
                    type: "string",
                    required: true
                },
                {
                    name: "value",
                    description: "Secret value",
                    type: "string",
                    required: true
                }
            ],
            handler: async (args) => {
                const vaultName = args[0];
                const key = args[1];
                const value = args.slice(2).join(" ");

                if (!vaultName || !key || !value) {
                    return "Error: vault, key, and value are required";
                }

                const vault = await secrets.globalVault(vaultName);
                await vault.set(key, value);
                return `Set '${key}' in global vault '${vaultName}'.`;
            }
        },
        {
            name: "del",
            description: "Delete a secret from a global vault",
            args: [
                {
                    name: "vault",
                    description: "Vault name",
                    type: "string",
                    required: true
                },
                {
                    name: "key",
                    description: "Secret key to delete",
                    type: "string",
                    required: true
                }
            ],
            handler: async (args) => {
                const vaultName = args[0];
                const key = args[1];

                if (!vaultName || !key) {
                    return "Error: vault and key are required";
                }

                const vault = await secrets.globalVault(vaultName);
                await vault.delete(key);
                return `Deleted '${key}' from global vault '${vaultName}'.`;
            }
        }
    ]
});
