import { Agent } from "./agent";
import { Storage } from "./storage";
import type { Chat } from "./storage";
import { CronManager } from "./cron";
import { commandManager } from "./commands";
import { Logger } from "./colors";
import { StatsManager } from "./stats";
import { UserManager } from "./users";
import { ensureDirs } from "./config";
import readline from "node:readline";
import { startServer } from "./api/index";

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: true,
});

async function main() {
    await ensureDirs();
    await UserManager.init();

    const args = process.argv.slice(2);
    let chatId = args.find(a => !a.startsWith("--"));
    const isPermanent = args.includes("--permanent");

    // CLI always acts as 'root' user
    const rootUser = UserManager.getUserById("root")!;
    const userId = "root";

    let chat: Chat | null = null;
    let isNewChat = false;

    if (chatId) {
        chat = await Storage.getChat(userId, chatId);
    }

    if (!chat) {
        isNewChat = true;
        chatId = chatId || `chat_${Math.random().toString(36).substring(7)}`;
        chat = {
            meta: {
                id: chatId,
                type: isPermanent ? "permanent" : "temporal",
                last_activity: new Date().toISOString(),
                message_count: 0,
                owner: userId,
            },
            messages: [],
        };
        await Storage.saveChat(chat);
        await StatsManager.trackChatCreated(userId);
    }

    const currentChat = chat;
    const agent = new Agent(currentChat);

    const pkg = await Bun.file("package.json").json();
    await Logger.banner(pkg.version);

    await startServer();

    await Logger.info(`Chat Session: ${chatId} (${currentChat.meta.type})`);

    const processCronJobs = async () => {
        const dueJobs = await CronManager.getAllDueJobs();
        for (const job of dueJobs) {
            const isCurrentChat = job.chatId === currentChat.meta.id && job.userId === userId;
            const jobChat = isCurrentChat ? currentChat : await Storage.getChat(job.userId, job.chatId);

            if (jobChat) {
                const jobAgent = isCurrentChat ? agent : new Agent(jobChat);
                try {
                    const response = await jobAgent.run(job.prompt);
                    if (isCurrentChat) {
                        await Logger.bot(response);
                        process.stdout.write(await Logger.prompt());
                    }
                } catch (e: any) {
                    await Logger.error(`Cron error: ${e.message}`);
                }
            }
        }
    };

    // Initial check and interval
    await processCronJobs();
    const cronInterval = setInterval(processCronJobs, 10000);

    const shutdown = async () => {
        clearInterval(cronInterval);
        if (isNewChat && currentChat.messages.length === 0) {
            await Storage.deleteChat(userId, currentChat.meta.id);
        }
        await Logger.info("Goodbye!");
        process.exit(0);
    };

    rl.on("SIGINT", shutdown);

    process.stdout.write(await Logger.prompt());

    for await (const line of rl) {
        const userInput = line.trim();
        if (userInput.toLowerCase() === "exit" || userInput.toLowerCase() === "quit") {
            await shutdown();
        }

        if (!userInput) {
            process.stdout.write(await Logger.prompt());
            continue;
        }

        try {
            const commandResult = await commandManager.handle(userInput, rootUser, currentChat);
            if (commandResult !== null) {
                console.log();
                await Logger.system(commandResult);
            } else {
                const response = await agent.run(userInput);
                await Logger.bot(response);
            }
            process.stdout.write(await Logger.prompt());
        } catch (e: any) {
            await Logger.error(e.message);
            process.stdout.write(await Logger.prompt());
        }
    }
}

main().catch(async (e) => {
    await Logger.error(`Fatal crash: ${e.message}`);
});
