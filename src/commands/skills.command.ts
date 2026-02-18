import { commandManager } from "./command-manager";
import { getUserSettings, getUserSettingsFile } from "../data/storage";
import { SkillManager } from "../data/skills";
import fs from "node:fs/promises";
import path from "node:path";

commandManager.register({
    name: "skills",
    description: "Manage personal skill overrides",
    subs: [
        {
            name: "list",
            description: "List all available skills",
            handler: async (args, { user }) => {
                const skills = await SkillManager.listSkills(user.id);
                return `Available Skills:\n${skills.map(s => `  • [${s.enabled ? '✔' : '✖'}] ${s.id} ${s.isGlobal ? '(shared)' : ''}`).join("\n")}`;
            }
        },
        {
            name: "toggle",
            description: "Toggle a skill on/off",
            args: [
                {
                    name: "skill_id",
                    description: "The skill ID to toggle",
                    type: "string",
                    required: true
                }
            ],
            handler: async (args, { user }) => {
                const id = args[0];
                if (!id) return "Error: skill_id is required";

                const settings = await getUserSettings(user.id);
                const file = getUserSettingsFile(user.id);
                const disabled = settings.disabled_skills || [];

                let newDisabled;
                if (disabled.includes(id)) {
                    newDisabled = disabled.filter(d => d !== id);
                } else {
                    newDisabled = [...disabled, id];
                }

                const current = await fs.readFile(file, "utf-8").then(c => JSON.parse(c)).catch(() => ({}));
                current.disabled_skills = newDisabled;
                await fs.mkdir(path.dirname(file), { recursive: true });
                await fs.writeFile(file, JSON.stringify(current, null, 4), "utf-8");
                return `Skill '${id}' ${newDisabled.includes(id) ? 'disabled' : 'enabled'} for you.`;
            }
        },
        {
            name: "instances",
            description: "List running skill instances",
            handler: async (args, { user }) => {
                const instances = SkillManager.listInstances(user.id);
                if (instances.length === 0) return "No running skill instances.";
                return `Running Skill Instances:\n${instances.map(s => `  • [${s.id}] ${s.skillId}:${s.actionName} - ${s.isFinished ? 'Finished' : 'Running'}`).join("\n")}`;
            }
        },
        {
            name: "kill",
            description: "Kill a running skill instance",
            args: [{ name: "id", description: "Instance ID", type: "string", required: true }],
            handler: async (args, { user }) => {
                if (!args[0]) return "Error: Instance ID is required";
                return await SkillManager.killInstance(user.id, args[0]);
            }
        },
        {
            name: "read",
            description: "Read skill instance output",
            args: [
                { name: "id", description: "Instance ID", type: "string", required: true },
                { name: "tail", description: "Bytes from tail", type: "string", required: false }
            ],
            handler: async (args, { user }) => {
                if (!args[0]) return "Error: Instance ID is required";
                const tail = args[1] ? parseInt(args[1]) : 0;
                return await SkillManager.readInstance(user.id, args[0], tail);
            }
        },
        {
            name: "write",
            description: "Write to skill instance stdin",
            args: [
                { name: "id", description: "Instance ID", type: "string", required: true },
                { name: "input", description: "Text to write", type: "string", required: true }
            ],
            handler: async (args, { user }) => {
                if (!args[0] || !args[1]) return "Error: Instance ID and input are required";
                return await SkillManager.writeInstance(user.id, args[0], args[1]);
            }
        },
        {
            name: "get",
            description: "Get detailed information and documentation for a specific skill",
            args: [{ name: "skill_id", description: "The skill ID", type: "string", required: true }],
            handler: async (args, { user }) => {
                if (!args[0]) return "Error: skill_id is required";
                const skill = await SkillManager.getSkill(user.id, args[0]);
                if (!skill) return `Skill '${args[0]}' not found.`;

                let out = `Skill: ${skill.definition.displayName} (${skill.id})\n`;
                out += `Description: ${skill.definition.description}\n`;
                out += `Status: ${skill.enabled ? 'Enabled' : 'Disabled'}\n`;
                out += `Global: ${skill.isGlobal ? 'Yes' : 'No'}\n`;

                if (skill.documentation) {
                    out += `\n--- Documentation ---\n${skill.documentation}\n`;
                }

                if (skill.definition.actions.length > 0) {
                    out += `\n--- Actions ---\n`;
                    for (const action of skill.definition.actions) {
                        out += `  • ${action.name}: ${action.description}\n`;
                    }
                }

                return out;
            }
        },
        {
            name: "run",
            description: "Run a skill manually",
            args: [
                { name: "skill_id", description: "Skill ID", type: "string", required: true },
                { name: "action", description: "Action name", type: "string", required: true },
                { name: "inputs", description: "JSON string of inputs", type: "string", required: false },
                { name: "bg", description: "Run in background ('true' or 'bg')", type: "string", required: false }
            ],
            handler: async (args, { user }) => {
                if (!args[0] || !args[1]) return "Error: skill_id and action are required";
                const inputs = args[2] ? JSON.parse(args[2]) : {};
                const bg = args[3] === "true" || args[3] === "bg";
                const result = await SkillManager.runSkill(user.id, args[0], args[1], inputs, "chat", undefined, bg);
                return bg ? `Skill started in background. ID: ${result}` : result;
            }
        }
    ]
});
