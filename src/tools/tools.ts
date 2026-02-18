import { Logger } from "@/cli/colors";
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
    private dynamicProviders: ((userId: string) => Promise<any[]>)[] = [];

    registerDynamicProvider(provider: (userId: string) => Promise<any[]>) {
        this.dynamicProviders.push(provider);
    }

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

    async getToolsForAI(userId: string, chat: Chat, settings: any): Promise<ToolDefinition[]> {
        const disabledTools = settings.disabled_tools || [];
        const tools = this.getDefinitions(disabledTools);

        const dynamicTools = await this.getDynamicTools(userId);
        const dynamicDefinitions = dynamicTools
            .map((t: any) => t.definition)
            .filter((d: any) => !disabledTools.includes(d.function.name));

        return [...tools, ...dynamicDefinitions];
    }

    async getDynamicTools(userId: string): Promise<any[]> {
        const all: any[] = [];
        for (const provider of this.dynamicProviders) {
            const tools = await provider(userId);
            all.push(...tools);
        }
        return all;
    }

    async execute(name: string, args: any, chat: Chat): Promise<string> {
        const userId = chat.meta.owner;

        // 1. Check static tools
        const staticTool = this.tools.get(name);
        let handler = staticTool?.handler;

        // 2. If not found, check dynamic tools
        if (!handler) {
            const dynamicTools = await this.getDynamicTools(userId);
            const dynamicTool = dynamicTools.find((t: any) => t.definition.function.name === name);
            if (dynamicTool) {
                handler = dynamicTool.handler;
            }
        }

        if (!handler) {
            return `Unknown tool: ${name}`;
        }

        let result = "";
        try {
            result = await handler(args, { chat });
        } catch (e: any) {
            result = `Error executing tool ${name}: ${e.message}`;
        }

        await ToolLogger.log(chat.meta.id, name, args, result);
        Logger.tool(name, args);
        return result;
    }
}

export const toolManager = new ToolManager();
