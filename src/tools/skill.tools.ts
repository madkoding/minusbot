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
            const def = { ...s.definition } as any;
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

        const def = { ...skill.definition } as any;
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
                    actionName: { type: "string" },
                    workspaceId: { type: "string" },
                    inputs: { type: "object" },
                    bg: { type: "boolean", description: "If true, runs in background and returns a session ID." }
                },
                required: ["id", "actionName", "inputs"],
            },
        },
    },
    async (args, { chat }) => {
        return await SkillManager.runSkill(chat.meta.owner, args.id, args.actionName, args.inputs, args.workspaceId, chat.meta.id, args.bg);
    }
);

toolManager.registerTool(
    {
        type: "function",
        function: {
            name: "skill_instance_ls",
            description: "List all skills currently running in the background.",
        },
    },
    async (args, { chat }) => {
        const instances = SkillManager.listInstances(chat.meta.owner);
        return JSON.stringify(instances.map(s => ({
            id: s.id,
            skillId: s.skillId,
            actionName: s.actionName,
            createdAt: s.createdAt,
            isFinished: s.isFinished
        })));
    }
);

toolManager.registerTool(
    {
        type: "function",
        function: {
            name: "skill_instance_kill",
            description: "Kill a running skill instance.",
            parameters: {
                type: "object",
                properties: { id: { type: "string" } },
                required: ["id"],
            },
        },
    },
    async (args, { chat }) => {
        return await SkillManager.killInstance(chat.meta.owner, args.id);
    }
);

toolManager.registerTool(
    {
        type: "function",
        function: {
            name: "skill_instance_read",
            description: "Read the output (stdout) of a running or finished skill instance.",
            parameters: {
                type: "object",
                properties: {
                    id: { type: "string" },
                    tail: { type: "integer", description: "Number of bytes to read from the end." }
                },
                required: ["id"],
            },
        },
    },
    async (args, { chat }) => {
        return await SkillManager.readInstance(chat.meta.owner, args.id, args.tail);
    }
);

toolManager.registerTool(
    {
        type: "function",
        function: {
            name: "skill_instance_write",
            description: "Write input (stdin) to a running skill instance.",
            parameters: {
                type: "object",
                properties: {
                    id: { type: "string" },
                    input: { type: "string" }
                },
                required: ["id", "input"],
            },
        },
    },
    async (args, { chat }) => {
        return await SkillManager.writeInstance(chat.meta.owner, args.id, args.input);
    }
);

// Register dynamic provider for Agent
toolManager.registerDynamicProvider(async (userId) => {
    const tools = await SkillManager.getToolsForUser(userId);

    // Also register them in the main toolManager for execution
    for (const tool of tools) {
        toolManager.registerTool(tool.definition, tool.handler);
    }

    return tools;
});
