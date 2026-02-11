import { commandManager } from "./command-manager";
import { UserManager, type Role } from "../data/users";
import bcrypt from "bcrypt";

// /users
commandManager.register({
    name: "users",
    description: "Manage system users.",
    usage: "/users list | add <u-n> <pass> | passwd <u-n> <new-pass> | role <u-n> <role> | remove <u-n>",
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
        if (sub === "passwd" && args[1] && args[2]) {
            const target = UserManager.getUserByUsername(args[1]);
            if (!target) return `User '${args[1]}' not found.`;

            if (target.id === "root" && user.id !== "root") {
                return "Error: Only the root user can change the root password.";
            }

            const passwordHash = await bcrypt.hash(args[2], 10);
            await UserManager.updateUser(target.id, { passwordHash });
            return `Password for user '${args[1]}' updated.`;
        }
        if (sub === "role" && args[1] && args[2]) {
            const target = UserManager.getUserByUsername(args[1]);
            const newRole = args[2] as Role;
            if (!target) return `User '${args[1]}' not found.`;

            if (target.id === "root") {
                return "Error: Cannot change the role of the root user.";
            }

            if (newRole === "root") {
                return "Error: There can only be one root user.";
            }

            if (user.role !== "root" && (target.role === "admin" || newRole === "admin")) {
                return "Error: Only the root user can manage administrator roles.";
            }

            await UserManager.updateUser(target.id, { role: newRole });
            return `Role for user '${args[1]}' updated to '${newRole}'.`;
        }
        if (sub === "remove" && args[1]) {
            const target = UserManager.getUserByUsername(args[1]);
            if (!target) return "User not found.";
            await UserManager.deleteUser(target.id);
            return `User '${args[1]}' removed.`;
        }
        return "Usage: /users list | add <u-n> <pass> | passwd <u-n> <new-pass> | role <u-n> <role> | remove <u-n>";
    }
});
