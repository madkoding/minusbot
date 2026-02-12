import { commandManager } from "./command-manager";
import { UserManager, type Role } from "../data/users";
import bcrypt from "bcrypt";

commandManager.register({
    name: "users",
    description: "Manage system users",
    needRole: "admin",
    subs: [
        {
            name: "list",
            description: "List all users",
            handler: async () => {
                return `Users:\n${UserManager.getUsers().map(u => `  • ${u.username} [${u.role}]`).join("\n")}`;
            }
        },
        {
            name: "add",
            description: "Add a new user",
            args: [
                {
                    name: "username",
                    description: "Username for the new user",
                    type: "string",
                    required: true
                },
                {
                    name: "password",
                    description: "Password for the new user",
                    type: "string",
                    required: true
                }
            ],
            handler: async (args) => {
                const username = args[0];
                const password = args[1];

                if (!username || !password) {
                    return "Error: username and password are required";
                }

                await UserManager.createUser(username, password, "user");
                return `User '${username}' created.`;
            }
        },
        {
            name: "passwd",
            description: "Change a user's password",
            args: [
                {
                    name: "username",
                    description: "Username to change password for",
                    type: "string",
                    required: true
                },
                {
                    name: "new_password",
                    description: "New password",
                    type: "string",
                    required: true
                }
            ],
            handler: async (args, { user }) => {
                const username = args[0];
                const newPassword = args[1];

                if (!username || !newPassword) {
                    return "Error: username and new_password are required";
                }

                const target = UserManager.getUserByUsername(username);
                if (!target) return `User '${username}' not found.`;

                if (target.id === "root" && user.id !== "root") {
                    return "Error: Only the root user can change the root password.";
                }

                const passwordHash = await bcrypt.hash(newPassword, 10);
                await UserManager.updateUser(target.id, { passwordHash });
                return `Password for user '${username}' updated.`;
            }
        },
        {
            name: "role",
            description: "Change a user's role",
            args: [
                {
                    name: "username",
                    description: "Username to change role for",
                    type: "string",
                    required: true
                },
                {
                    name: "role",
                    description: "New role (user, admin, root)",
                    type: "string",
                    required: true,
                    choices: [
                        { name: "user", value: "user" },
                        { name: "admin", value: "admin" },
                        { name: "root", value: "root" }
                    ]
                }
            ],
            handler: async (args, { user }) => {
                const username = args[0];
                const newRole = args[1] as Role;

                if (!username || !newRole) {
                    return "Error: username and role are required";
                }

                const target = UserManager.getUserByUsername(username);
                if (!target) return `User '${username}' not found.`;

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
                return `Role for user '${username}' updated to '${newRole}'.`;
            }
        },
        {
            name: "remove",
            description: "Remove a user",
            args: [
                {
                    name: "username",
                    description: "Username to remove",
                    type: "string",
                    required: true
                }
            ],
            handler: async (args) => {
                const username = args[0];
                if (!username) return "Error: username is required";

                const target = UserManager.getUserByUsername(username);
                if (!target) return "User not found.";

                await UserManager.deleteUser(target.id);
                return `User '${username}' removed.`;
            }
        }
    ]
});
