import { toolManager } from "./tools";
import { SkillManager } from "../skills";

// Register Core Skills Tools
toolManager.registerTool(
    {
        type: "function",
        function: {
            name: "skill_list",
            description: "List all available skills",
        },
    },
    async (args, { chat }) => {
        const skills = await SkillManager.listSkills(chat.meta.owner);
        const enabledSkills = skills.filter(s => s.enabled);
        return JSON.stringify(enabledSkills.map(s => ({ id: s.id, definition: s.definition })));
    }
);

toolManager.registerTool(
    {
        type: "function",
        function: {
            name: "skill_get",
            description: "Get details of a specific skill",
            parameters: {
                type: "object",
                properties: { id: { type: "string" } },
                required: ["id"],
            },
        },
    },
    async (args, { chat }) => {
        const skill = await SkillManager.getSkill(chat.meta.owner, args.id);
        return JSON.stringify(skill || { error: "Skill not found" });
    }
);

toolManager.registerTool(
    {
        type: "function",
        function: {
            name: "skill_run",
            description: "Run a skill",
            parameters: {
                type: "object",
                properties: {
                    id: { type: "string" },
                    inputs: { type: "object" },
                },
                required: ["id", "inputs"],
            },
        },
    },
    async (args, { chat }) => {
        return await SkillManager.runSkill(chat.meta.owner, args.id, args.inputs, chat.meta.id);
    }
);
