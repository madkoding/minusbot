import type { Chat } from "../data/storage";
import { ToolLogger } from "../logger";

export interface ToolDefinition {
    type: "function";
    function: {
        name: string;
        description: string;
        parameters?: any;
    };
}

export type ToolHandler = (args: any, context: { chat: Chat }) => Promise<string>;

export class ToolManager {
    private tools: Map<string, { definition: ToolDefinition; handler: ToolHandler }> = new Map();

    registerTool(definition: ToolDefinition, handler: ToolHandler) {
        this.tools.set(definition.function.name, { definition, handler });
    }

    getDefinitions(disabledTools: string[] = []): ToolDefinition[] {
        return Array.from(this.tools.values())
            .filter(t => !disabledTools.includes(t.definition.function.name))
            .map(t => t.definition);
    }

    getAllDefinitions(): ToolDefinition[] {
        return Array.from(this.tools.values()).map(t => t.definition);
    }

    async execute(name: string, args: any, chat: Chat): Promise<string> {
        const tool = this.tools.get(name);
        if (!tool) {
            return `Unknown tool: ${name}`;
        }

        let result = "";
        try {
            result = await tool.handler(args, { chat });
        } catch (e: any) {
            result = `Error executing tool ${name}: ${e.message}`;
        }

        await ToolLogger.log(chat.meta.id, name, args, result);
        return result;
    }
}

export const toolManager = new ToolManager();
