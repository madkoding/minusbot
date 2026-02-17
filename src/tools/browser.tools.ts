import { toolManager } from "../tools";
import { BrowserManager } from "../browser/manager";
import type { BrowserStep } from "../browser/manager";

toolManager.registerTool(
    {
        type: "function",
        function: {
            name: "browser_list_scripts",
            description: "List all saved browser automation scripts (plans).",
        },
    },
    async (args, { chat }) => {
        const scripts = await BrowserManager.listScripts(chat.meta.owner);
        return JSON.stringify(scripts);
    }
);

toolManager.registerTool(
    {
        type: "function",
        function: {
            name: "browser_pilot",
            description: "Explore a website. Navigates to a URL and optionally performs interactive steps. Returns a simplified DOM view.",
            parameters: {
                type: "object",
                properties: {
                    url: { type: "string", description: "The URL to navigate to." },
                    steps: {
                        type: "array",
                        description: "Optional list of steps to perform on the page before returning state.",
                        items: {
                            type: "object",
                            properties: {
                                action: { type: "string", enum: ["click", "type", "wait"] },
                                selector: { type: "string", description: "CSS Selector" },
                                text: { type: "string", description: "Text to type if action is 'type'" }
                            },
                            required: ["action"]
                        }
                    }
                },
                required: ["url"],
            },
        },
    },
    async (args, { chat }) => {
        const result = await BrowserManager.execute(chat.meta.owner, "pilot", {
            url: args.url,
            steps: args.steps as BrowserStep[]
        });
        return JSON.stringify(result);
    }
);

toolManager.registerTool(
    {
        type: "function",
        function: {
            name: "browser_save_script",
            description: "Save a sequence of browser steps as a named automation script. Use this after figuring out how to scrape or automate a site.",
            parameters: {
                type: "object",
                properties: {
                    id: { type: "string", description: "Unique snake_case ID." },
                    name: { type: "string", description: "Human friendly name." },
                    description: { type: "string", description: "What this automation does." },
                    targetUrl: { type: "string", description: "Default URL." },
                    steps: {
                        type: "array",
                        items: {
                            type: "object",
                            properties: {
                                action: { type: "string", enum: ["navigate", "click", "type", "wait"] },
                                selector: { type: "string" },
                                text: { type: "string" },
                                url: { type: "string" }
                            },
                            required: ["action"]
                        }
                    }
                },
                required: ["id", "name", "targetUrl", "steps"],
            },
        },
    },
    async (args, { chat }) => {
        await BrowserManager.saveScript(chat.meta.owner, {
            id: args.id,
            name: args.name,
            description: args.description || "",
            targetUrl: args.targetUrl,
            steps: args.steps as BrowserStep[]
        });
        return `SUCCESS: Browser script '${args.id}' saved successfully.`;
    }
);

toolManager.registerTool(
    {
        type: "function",
        function: {
            name: "browser_execute",
            description: "Run a saved browser automation script (job).",
            parameters: {
                type: "object",
                properties: {
                    scriptId: { type: "string", description: "The ID of the script to execute." },
                    urlOverride: { type: "string", description: "Optional URL override." }
                },
                required: ["scriptId"],
            },
        },
    },
    async (args, { chat }) => {
        const result = await BrowserManager.execute(chat.meta.owner, "execute", {
            scriptId: args.scriptId,
            url: args.urlOverride
        });
        return JSON.stringify(result);
    }
);
