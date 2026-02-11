import { getJson } from "serpapi";

import { Integration } from "../base";
import type { IntegrationSchema } from "../base";
import type { ToolDefinition, ToolHandler } from "../../tools/tools";
import { Logger } from "../../cli/colors";

export class SerpApiIntegration extends Integration {
    static readonly ID = "serpapi";

    readonly id = SerpApiIntegration.ID;
    readonly name = "Google Search (SerpApi)";
    readonly description = "Enables web searching capabilities using SerpApi.";

    readonly schema: IntegrationSchema = {
        id: this.id,
        name: this.name,
        description: this.description,
        fields: [
            { id: "engine", label: "Search Engine", type: "string", description: "Search engine to use (default: google)" },
            { id: "location", label: "Location", type: "string", description: "Location for search results (e.g. Austin, Texas)" },
            { id: "google_domain", label: "Google Domain", type: "string", description: "Google domain to use (default: google.com)" },
            { id: "gl", label: "Country Code", type: "string", description: "Country code (e.g. us, uk)" },
            { id: "hl", label: "Language Code", type: "string", description: "Language code (e.g. en, es)" },
        ],
        vaultKeys: ["API_KEY"]
    };

    private apiKey?: string;

    async start() {
        const vault = await this.getVault(this.user.id);
        this.apiKey = vault.get("API_KEY");

        if (this.apiKey) {
            await Logger.info(`SerpApi integration active for ${this.user.username}`);
        }
    }

    async stop() {
        // No persistent connection to close
    }

    override async getTools(): Promise<{ definition: ToolDefinition, handler: ToolHandler }[]> {
        if (!this.apiKey) return [];

        return [
            {
                definition: {
                    type: "function",
                    function: {
                        name: "web_search",
                        description: "Search the web for information using Google.",
                        parameters: {
                            type: "object",
                            properties: {
                                query: { type: "string", description: "The search query" }
                            },
                            required: ["query"]
                        }
                    }
                },
                handler: async (args: any) => {
                    return new Promise((resolve, reject) => {
                        try {
                            getJson({
                                engine: this.config.engine || "google",
                                q: args.query,
                                location: this.config.location,
                                google_domain: this.config.google_domain || "google.com",
                                gl: this.config.gl || "us",
                                hl: this.config.hl || "en",
                                api_key: this.apiKey
                            }, (json: any) => {
                                if (json.error) {
                                    resolve(`Search error: ${json.error}`);
                                } else if (json.organic_results) {
                                    const results = json.organic_results.slice(0, 5).map((r: any) =>
                                        `[${r.title}](${r.link}): ${r.snippet}`
                                    ).join("\n\n");
                                    resolve(results || "No results found.");
                                } else {
                                    resolve("No organic results found.");
                                }
                            });
                        } catch (e: any) {
                            resolve(`Error performing search: ${e.message}`);
                        }
                    });
                }
            }
        ];
    }
}
