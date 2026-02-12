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
        }
    ]
});
