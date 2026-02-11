import { toolManager } from "./tools";
import { SkillManager } from "../data/skills";

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
        return JSON.stringify(enabledSkills.map(s => {
            const def = { ...s.definition };
            Object.keys(def).forEach(k => {
                if (k.startsWith("_")) delete def[k];
            });
            return { id: s.id, definition: def };
        }));
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
        if (!skill) return JSON.stringify({ error: "Skill not found" });

        const def = { ...skill.definition };
        Object.keys(def).forEach(k => {
            if (k.startsWith("_")) delete def[k];
        });

        return JSON.stringify({ ...skill, definition: def });
    }
);

toolManager.registerTool(
    {
        type: "function",
        function: {
            name: "skill_run",
            description: "Run a skill. Use workspaceId='chat' to use the current chat space.",
            parameters: {
                type: "object",
                properties: {
                    id: { type: "string" },
                    workspaceId: { type: "string" },
                    inputs: { type: "object" },
                },
                required: ["id", "inputs"],
            },
        },
    },
    async (args, { chat }) => {
        return await SkillManager.runSkill(chat.meta.owner, args.id, args.inputs, args.workspaceId, chat.meta.id);
    }
);
