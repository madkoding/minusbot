import { secrets } from "../src/secrets";
import { SETTINGS_FILE, getSettings } from "../src/config";
import fs from "node:fs/promises";
import readline from "node:readline";

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
});

const question = (query: string): Promise<string> =>
    new Promise((resolve) => rl.question(query, resolve));

async function setup() {
    console.log("\n\x1b[36m󱙺\x1b[0m \x1b[1mMinusbot Configuration Setup\x1b[0m\n");

    // 1. Provider selection
    console.log("Select your AI Provider:");
    console.log("  1. OpenAI");
    console.log("  2. OpenRouter");
    console.log("  3. Custom (Local LLM, etc.)");

    const choice = await question("\nChoice (1-3): ");

    let endpoint = "";
    if (choice === "1") {
        endpoint = "https://api.openai.com/v1";
    } else if (choice === "2") {
        endpoint = "https://openrouter.ai/api/v1";
    } else {
        endpoint = await question("Enter API Base URL (e.g., http://localhost:11434/v1): ");
    }

    // 2. API Key
    const apiKey = await question("Enter your API Key: ");
    const vault = await secrets.vault("agent");
    await vault.set("API_KEY", apiKey);

    // 3. Fetch Models
    console.log("\n\x1b[36mℹ\x1b[0m Fetching available models...");
    try {
        const response = await fetch(`${endpoint}/models`, {
            headers: {
                Authorization: `Bearer ${apiKey}`,
            },
        });

        if (!response.ok) {
            throw new Error(`Cloud not fetch models: ${response.statusText}`);
        }

        const data = (await response.json()) as any;
        const models = data.data?.map((m: any) => m.id) || [];

        if (models.length === 0) {
            console.log("\x1b[31m✘ No models found in this endpoint.\x1b[0m");
            const manualModel = await question("Enter model ID manually: ");
            await saveSettings(manualModel, endpoint);
        } else {
            console.log("\nAvailable models:");
            models.sort().forEach((m: string, i: number) => {
                console.log(`  ${(i + 1).toString().padEnd(3)}. ${m}`);
            });

            let selectedModel = "";
            while (!selectedModel) {
                const modelInput = await question(`\nSelect model (number 1-${models.length} or ID): `);

                // Try to parse as number
                const index = parseInt(modelInput);
                if (!isNaN(index) && index > 0 && index <= models.length) {
                    selectedModel = models[index - 1];
                }
                // Try to match as ID
                else if (models.includes(modelInput)) {
                    selectedModel = modelInput;
                }
                else {
                    console.log(`\x1b[31m✘ Invalid selection: "${modelInput}". Please try again.\x1b[0m`);
                }
            }

            await saveSettings(selectedModel, endpoint);
        }
    } catch (e: any) {
        console.error(`\x1b[31m✘ Error fetching models: ${e.message}\x1b[0m`);
        const manualModel = await question("Enter model ID manually: ");
        await saveSettings(manualModel, endpoint);
    }

    console.log("\n\x1b[32m✔ Setup completed successfully!\x1b[0m");
    console.log(`\x1b[36mℹ\x1b[0m You can now run the bot using: \x1b[1mbun start\x1b[0m\n`);
    process.exit(0);
}

async function saveSettings(model_id: string, ai_endpoint: string) {
    const settings = await getSettings();
    settings.model_id = model_id;
    settings.ai_endpoint = ai_endpoint;
    await fs.writeFile(SETTINGS_FILE, JSON.stringify(settings, null, 4), "utf-8");
}

setup();
