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
    description: "Show list of commands.",
    usage: "/help",
    handler: async (args) => {
        return `Available Commands:\n${commandManager.getCommands().map(c => `  • /${c.name.padEnd(10)} - ${c.description}`).join("\n")}`;
    }
});
