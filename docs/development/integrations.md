# 🔌 Developing Integrations

Integrations allow Minusbot to access external APIs and services, providing new tools for the AI agent.

## 🏗️ Structure of an Integration

All integrations must extend the `Integration` abstract class defined in `src/integrations/integration-base.ts`.

```typescript
import { Integration, IntegrationSchema } from "../integration-base";

export class MyIntegration extends Integration {
    readonly id = "my-integration";
    readonly name = "My Integration";
    readonly description = "Integration with My Service";
    
    readonly schema: IntegrationSchema = {
        id: "my-integration",
        name: "My Integration",
        description: "Integration with My Service",
        fields: [
            {
                id: "api_key",
                label: "API Key",
                type: "string",
                secret: true
            }
        ]
    };

    async start() {
        // Initialize API client here
        const config = await this.getVault(this.user.id);
        const apiKey = config.get("api_key");
        // ...
    }

    async stop() {
        // Cleanup API client here
    }

    // Expose tools to the AI Agent
    async getTools(): Promise<{ definition: ToolDefinition, handler: ToolHandler }[]> {
        return [
            {
                definition: {
                    name: "my_tool",
                    description: "Does something awesome",
                    parameters: {
                        type: "object",
                        properties: {
                            arg: { type: "string" }
                        },
                        required: ["arg"]
                    }
                },
                handler: async (args) => {
                    // Call API using client
                    return await this.client.doSomething(args.arg);
                }
            }
        ];
    }
}
```

## ⚙️ Configuration Schema

The `schema` property defines what configuration the integration needs from the user.
-  `fields`: Array of fields (strings, numbers, booleans) for user configuration.
-  `vaultKeys`: Keys that should be stored securely in the Vault.

## 🔗 Registering the Integration

Integrations must be registered in `src/integrations/integration-manager.ts`.
