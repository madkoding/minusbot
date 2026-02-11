import { commandManager } from "./command-manager";
import { secrets } from "../secrets";

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
