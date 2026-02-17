import fs from "node:fs/promises";

import { commandManager } from "./command-manager";
import { Storage } from "../data/storage";
import { getUserSettings } from "../data/storage";

// /clear
commandManager.register({
    name: "clear",
    description: "Clear the history of the current chat.",
    usage: "/clear",
    handler: async (args, { chat }) => {
        chat.messages = [];
        await Storage.saveChat(chat);
        return "Chat history cleared.";
    }
});

// /start
commandManager.register({
    name: "start",
    description: "Validate your setup and get started.",
    usage: "/start",
    handler: async (args, { user }) => {
        const settings = await getUserSettings(user.id);
        const activeTextProviderId = settings.active_providers?.text;

        let report = `## Welcome to Minusbot, ${user.username}! 🐱🚀\n\n`;
        report += `This command helps you verify your configuration.\n\n### 🤖 AI Configuration Status\n`;

        if (activeTextProviderId) {
            const { ProviderManager } = await import("../data/providers");
            const provider = await ProviderManager.getProvider(activeTextProviderId, user.id);
            if (provider) {
                report += `✅ **Active Text Provider**: ${provider.name}\n`;
                report += `✅ **Protocol**: \`${provider.client}\`\n`;
                report += `✅ **Model ID**: \`${provider.config.model_id}\`\n`;

                const token = await ProviderManager.getProviderToken(activeTextProviderId, user.id);
                if (token) {
                    report += `✅ **Credentials**: Securely Stored\n`;

                    try {
                        report += `\n> *Attempting to validate connection...*\n`;
                        const { AIRegistry } = await import("../ai/registry");
                        const client = AIRegistry.getClient(provider.client);
                        if (client) {
                            const result = await client.chat({
                                apiKey: token,
                                model: provider.config.model_id,
                                messages: [{ role: "user", content: "hi" }],
                                max_tokens: 5,
                                extra: provider.config.extra
                            });
                            report += `✅ **Connection**: Successful!\n`;
                        }
                    } catch (e: any) {
                        report += `❌ **Connection Failed**: ${e.message}\n`;
                    }
                } else {
                    report += `❌ **Credentials**: Missing token (Edit the provider to add it)\n`;
                }
            } else {
                report += `⚠️ **Provider ${activeTextProviderId}** was selected but no longer exists.\n`;
            }
        } else {
            report += `❌ **No Active Provider**: Please visit **Settings > AI Providers** to register and activate one.\n`;
        }


        report += `\n### 🚀 Getting Started\n`;
        report += `• Type \`/help\` to see all slash commands.\n`;
        report += `• Use \`/skills\` to manage your dynamic capabilities.\n`;
        report += `• Simply type a message to start chatting!\n`;

        return report;
    }
});

// /help
commandManager.register({
    name: "help",
    description: "Show list of commands or help for a specific command.",
    usage: "/help [command] [subcommand...]",
    handler: async (args) => {
        if (args.length === 0) {
            return `Available Commands:\n${commandManager.getCommands().map(c => `  • **/${c.name.padEnd(10)}** - ${c.description}`).join("\n")}\n\nType \`/help <command>\` for more details.`;
        }

        // Search for the command/subcommand
        const firstArg = args[0];
        if (!firstArg) return "Error: No command specified.";

        let currentCmd: any = commandManager.getCommand(firstArg);
        const path = ["/" + firstArg];

        if (!currentCmd) {
            return `Error: Command \`/${firstArg}\` not found.`;
        }

        for (let i = 1; i < args.length; i++) {
            const subName = args[i]?.toLowerCase();
            if (!subName) break;

            const sub = currentCmd.subs?.find((s: any) => s.name.toLowerCase() === subName);
            if (sub) {
                currentCmd = sub;
                path.push(subName);
            } else {
                break;
            }
        }

        let response = `### Help: \`${path.join(" ")}\`\n`;
        response += `> ${currentCmd.description}\n\n`;

        if (currentCmd.usage) {
            response += `**Usage:** \`${currentCmd.usage}\`\n`;
        } else {
            // Auto-generate usage if missing
            let autoUsage = `\`${path.join(" ")}`;
            if (currentCmd.subs && currentCmd.subs.length > 0) autoUsage += ` <subcommand>`;
            if (currentCmd.args && currentCmd.args.length > 0) {
                for (const arg of currentCmd.args) {
                    autoUsage += arg.required ? ` <${arg.name}>` : ` [${arg.name}]`;
                }
            }
            autoUsage += `\``;
            response += `**Usage:** ${autoUsage}\n`;
        }

        if (currentCmd.args && currentCmd.args.length > 0) {
            response += `\n**Arguments:**\n`;
            for (const arg of currentCmd.args) {
                response += `- **${arg.name}** (${arg.type}${arg.required ? ', required' : ''}): ${arg.description}\n`;
                if (arg.choices) {
                    response += `  *Choices: ${arg.choices.map((c: any) => `\`${c.value}\``).join(", ")}*\n`;
                }
            }
        }

        if (currentCmd.subs && currentCmd.subs.length > 0) {
            response += `\n**Subcommands:**\n`;
            for (const sub of currentCmd.subs) {
                response += `- \`${sub.name}\`: ${sub.description}\n`;
            }
            response += `\nType \`/help ${args.join(" ")} <subcommand>\` for more info.`;
        }

        return response;
    }
});
