import { commandManager } from "./command-manager";
import { Storage } from "../data/storage";
import { getUserSettings, getUserIntegrationConfigFile } from "../data/storage";
import { secrets } from "../secrets";
import { UserManager } from "../data/users";
import fs from "node:fs/promises";

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
        const vault = await secrets.vault(user.id, "agent");
        const apiKey = vault.get("API_KEY");

        let report = `Welcome to Minusbot, ${user.username}!\n\nSystem Check:\n`;

        // 1. API Key Check
        if (apiKey && apiKey.length > 5) {
            report += "  ✅ API Key configured\n";
        } else {
            report += "  ❌ API Key missing (Use /env set agent API_KEY ...)\n";
        }

        // 2. Telegram Check (user specific)
        try {
            const tgConfigPath = getUserIntegrationConfigFile(user.id, 'telegram');
            const tgConfigContent = await fs.readFile(tgConfigPath, 'utf-8');
            const tgConfig = JSON.parse(tgConfigContent);
            if (tgConfig.user_id && tgConfig.chat_id) {
                report += `  ✅ Telegram Configured (Chat: ${tgConfig.chat_id}, User: ${tgConfig.user_id})\n`;
            } else {
                report += "  ⚠️ Telegram config incomplete\n";
            }
        } catch {
            report += "  ℹ️ Telegram integration not setup\n";
        }

        // 3. Settings Check
        report += `  ✅ Model: ${settings.model_id}\n`;
        report += `  ✅ Endpoint: ${settings.ai_endpoint}\n`;

        // 4. Validate Endpoint & Model
        if (apiKey) {
            try {
                report += "\nValidating LLM Connection...\n";
                // Try to list models to validate key and endpoint accessibility
                // Note: Not all endpoints support /models, but standard OpenAI compatible ones usually do
                const response = await fetch(`${settings.ai_endpoint}/models`, {
                    headers: {
                        "Authorization": `Bearer ${apiKey}`
                    }
                });

                if (response.ok) {
                    const data: any = await response.json();
                    report += "  ✅ Endpoint Reachable\n";

                    // Simple check if model exists in list (if list is available)
                    if (data && Array.isArray(data.data)) {
                        const modelExists = data.data.some((m: any) => m.id === settings.model_id);
                        if (modelExists) {
                            report += "  ✅ Model ID found in provider list\n";
                        } else {
                            report += "  ⚠️ Model ID not found in matched list (might still work if alias)\n";
                        }
                    } else {
                        report += "  ✅ Auth successful (Model list not returned standardly)\n";
                    }

                    report += "\n🎉 Everything looks good! You can start chatting now.\nTip: Type /help to see commands or just verify your AI by saying 'Hello'.";
                } else {
                    const errText = await response.text();
                    report += `  ❌ Endpoint Validation Failed: ${response.status} - ${errText.substring(0, 100)}`;
                }
            } catch (e: any) {
                report += `  ❌ Validation Error: ${e.message}`;
            }
        } else {
            report += "\n❌ Cannot validate connection without API Key.";
        }

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
