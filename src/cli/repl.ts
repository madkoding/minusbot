import readline from "node:readline";

import { Logger } from "./colors";
import { InputProcessor } from "../processor";
import { Storage } from "../data/storage";
import { StatsManager } from "../data/statistics";
import { UserManager } from "../data/users";
import { Agent } from "../agent";
import { TaskManager } from "../data/tasks";
import { PubSub } from "../pubsub";
import type { Chat } from "../data/storage";

export async function runCLI(chatId: string | null, userId: string, isPermanent: boolean) {
    // CLI always acts as 'root' user if not specified
    userId = userId || "root";
    await UserManager.init(); // Ensure users needed are simpler here? Probably index.ts handles init

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

    const currentChat = chat!;
    await Logger.info(`Chat Session: ${chatId} (${currentChat.meta.type})`);

    // We import agent here to avoid circular dep issues potentially or keep it clean
    const agent = new Agent(currentChat);

    // Guard for cron processor
    let isProcessing = false;
    const processCronJobs = async () => {
        if (isProcessing) return;
        isProcessing = true;
        try {
            const dueJobs = await TaskManager.getAllDueJobs();
            for (const job of dueJobs) {
                const isCurrentChat = job.chatId === currentChat.meta.id && job.userId === userId;
                const jobChat = isCurrentChat ? currentChat : await Storage.getChat(job.userId, job.chatId);

                if (jobChat) {
                    const jobAgent = isCurrentChat ? agent : new Agent(jobChat);
                    try {
                        // Send system context about cron trigger
                        const systemContext = `[CRON TRIGGERED] Task: "${job.prompt}"\nAction: Please process this scheduled task immediately.`;

                        // We use ephemeral: true so this trigger doesn't clutter chat history
                        const response = await jobAgent.run(systemContext, {
                            _ephemeral: true,
                            _from_cron: true,
                            _role: "system"
                        });

                        // We don't publish here anymore because jobAgent.run calls PubSub.publish internally
                        if (isCurrentChat && response && response.trim()) {
                            await Logger.bot(response);
                            process.stdout.write(await Logger.prompt());
                        }
                    } catch (e: any) {
                        await Logger.error(`Cron error: ${e.message}`);
                    }
                }
            }
        } finally {
            isProcessing = false;
        }
    };

    // Initial check and interval for CLI
    await processCronJobs();
    const cronInterval = setInterval(processCronJobs, 2000);

    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
        terminal: true,
    });

    const shutdown = async () => {
        clearInterval(cronInterval);

        // Reload chat to check accurate message count
        const latestChat = await Storage.getChat(userId, chatId!);
        if (latestChat && latestChat.meta.type === "temporal" && latestChat.messages.length === 0) {
            try {
                await Storage.deleteChat(userId, chatId!);
            } catch (e: any) {
                await Logger.error(`Failed to cleanup empty temporal chat: ${e.message}`);
            }
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
            const isCommand = userInput.startsWith("/");
            const response = await InputProcessor.process(userInput, userId, chatId!, { _from_cli: true });

            if (isCommand) {
                console.log();
                await Logger.system(response);
            } else {
                await Logger.bot(response);
            }
            process.stdout.write(await Logger.prompt());
        } catch (e: any) {
            await Logger.error(e.message);
            process.stdout.write(await Logger.prompt());
        }
    }
}
