import { commandManager, type CommandInfo } from "./command-manager";
import { ProviderManager } from "../data/providers";
import { AIRegistry } from "../ai/registry";
import { getUserSettings, getGlobalSettings, getUserSettingsFile, getGlobalSettingsFile } from "../data/storage";
import fs from "node:fs/promises";
import { v4 as uuid } from "uuid";

const createProvidersCommand = (isGlobal: boolean): CommandInfo => {
    const name = isGlobal ? "gproviders" : "providers";
    const description = isGlobal ? "Manage global AI providers (Admin Only)" : "Manage your personal AI providers";
    const needRole = isGlobal ? "admin" : undefined;

    return {
        name,
        description,
        needRole,
        subs: [
            {
                name: "list",
                description: "List all available providers",
                handler: async (_args, { user }) => {
                    const providers = await ProviderManager.listProviders(user.id);
                    const filtered = providers.filter(p => p.is_global === isGlobal);

                    if (filtered.length === 0) return `No ${isGlobal ? 'global' : 'personal'} providers found.`;

                    const settings = isGlobal ? await getGlobalSettings() : await getUserSettings(user.id);
                    const activeText = settings.active_providers?.text;

                    let report = `### ${isGlobal ? 'Global' : 'Personal'} AI Providers:\n`;
                    for (const p of filtered) {
                        const isActive = activeText === p.id;
                        report += `• **${p.name}** [${p.client}] (${p.config.model_id})${isActive ? ' -- ACTIVE' : ''}\n  ID: \`${p.id}\` | Type: \`${p.type}\`\n`;
                    }
                    return report;
                }
            },
            {
                name: "add",
                description: "Add a new AI provider",
                args: [
                    { name: "name", description: "Friendly name", type: "string", required: true },
                    { name: "client", description: "Protocol (openai, openrouter, etc.)", type: "string", required: true },
                    { name: "model", description: "Model ID (gpt-4o, etc.)", type: "string", required: true },
                    { name: "type", description: "Type (text, vision, image, tts, stt)", type: "string", required: false }
                ],
                handler: async (args, { user }) => {
                    const name = args[0]!;
                    const clientId = args[1]!;
                    const modelId = args[2]!;
                    const typeArg = args[3];
                    const type = (typeArg || "text") as any;

                    const client = AIRegistry.getClient(clientId);
                    if (!client) return `Error: Unknown client protocol \`${clientId}\`.`;

                    const id = uuid().split('-')[0]!;
                    const provider = {
                        id,
                        name,
                        type,
                        client: clientId,
                        config: {
                            model_id: modelId,
                            max_tokens: 4096,
                            temperature: 0.7,
                            extra: {}
                        },
                        is_global: isGlobal,
                        owner: isGlobal ? undefined : user.id
                    };

                    await ProviderManager.saveProvider(provider, isGlobal ? undefined : user.id);
                    return `✅ Provider **${name}** created with ID \`${id}\`.\nNow set your API key with \`/${isGlobal ? 'g' : ''}providers set-token ${id} [key]\``;
                }
            },
            {
                name: "set-token",
                description: "Set the API key/token for a provider",
                args: [
                    { name: "id", description: "Provider ID", type: "string", required: true },
                    { name: "token", description: "API Key", type: "string", required: true }
                ],
                handler: async (args, { user }) => {
                    const id = args[0]!;
                    const token = args[1]!;
                    const provider = await ProviderManager.getProvider(id, user.id);
                    if (!provider) return `Error: Provider \`${id}\` not found.`;
                    if (provider.is_global !== isGlobal) return `Error: Provider \`${id}\` is not a ${isGlobal ? 'global' : 'personal'} provider.`;

                    await ProviderManager.setProviderToken(id, token, isGlobal ? undefined : user.id);
                    return `✅ Token updated for provider **${provider.name}**.`;
                }
            },
            {
                name: "activate",
                description: "Set a provider as active for a specific type",
                args: [
                    { name: "id", description: "Provider ID", type: "string", required: true }
                ],
                handler: async (args, { user }) => {
                    const id = args[0]!;
                    const provider = await ProviderManager.getProvider(id, user.id);
                    if (!provider) return `Error: Provider \`${id}\` not found.`;

                    const useGlobalSettings = isGlobal;
                    const settings = useGlobalSettings ? await getGlobalSettings() : await getUserSettings(user.id);

                    if (!settings.active_providers) settings.active_providers = {};
                    settings.active_providers[provider.type] = id;

                    const file = useGlobalSettings ? getGlobalSettingsFile() : getUserSettingsFile(user.id);
                    await fs.writeFile(file, JSON.stringify(settings, null, 4), "utf-8");

                    return `✅ Provider **${provider.name}** is now the active **${provider.type}** provider ${useGlobalSettings ? 'GLOBALLY' : 'for you'}.`;
                }
            },
            {
                name: "delete",
                description: "Delete an AI provider",
                args: [
                    { name: "id", description: "Provider ID", type: "string", required: true }
                ],
                handler: async (args, { user }) => {
                    const id = args[0]!;
                    const provider = await ProviderManager.getProvider(id, user.id);
                    if (!provider) return `Error: Provider \`${id}\` not found.`;
                    if (provider.is_global !== isGlobal) return "Error: Unauthorized.";

                    await ProviderManager.deleteProvider(id, isGlobal ? undefined : user.id);
                    return `✅ Provider **${provider.name}** deleted.`;
                }
            },
            {
                name: "clients",
                description: "List available client protocols",
                handler: async () => {
                    const clients = AIRegistry.getAllClients();
                    return `Available Client Protocols:\n${clients.map(c => `• **${c.id}**: ${c.name} (${c.types.join(", ")})`).join("\n")}`;
                }
            }
        ]
    };
};

commandManager.register(createProvidersCommand(false)); // /providers
commandManager.register(createProvidersCommand(true));  // /gproviders
