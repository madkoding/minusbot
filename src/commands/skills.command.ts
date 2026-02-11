import { commandManager } from "./command-manager";
import { getUserSettings, getUserSettingsFile } from "../data/storage";
import { SkillManager } from "../data/skills";
import fs from "node:fs/promises";
import path from "node:path";

// /skills
commandManager.register({
    name: "skills",
    description: "Toggle personal skill overrides.",
    usage: "/skills list | /skills toggle <id>",
    handler: async (args, { user }) => {
        const sub = args[0]?.toLowerCase();
        const settings = await getUserSettings(user.id);
        const file = getUserSettingsFile(user.id);

        if (sub === "list") {
            const skills = await SkillManager.listSkills(user.id);
            return `Available Skills:\n${skills.map(s => `  • [${s.enabled ? '✔' : '✖'}] ${s.id} ${s.isGlobal ? '(shared)' : ''}`).join("\n")}`;
        }

        if (sub === "toggle" && args[1]) {
            const id = args[1];
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
        return "Usage: /skills list | /skills toggle <id>";
    }
});
