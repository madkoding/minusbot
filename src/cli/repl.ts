import readline from "node:readline";

import { Logger } from "./colors";
import { InputProcessor } from "../processor";
import { Storage } from "../storage";
import { StatsManager } from "../stats";
import { UserManager } from "../users";
import { Agent } from "../agent";
import { CronManager } from "../cron";
import { PubSub } from "../pubsub";
import type { Chat } from "../storage";

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

    // Setup Cron Listener affecting CLI
    const processCronJobs = async () => {
        const dueJobs = await CronManager.getAllDueJobs();
        for (const job of dueJobs) {
            const isCurrentChat = job.chatId === currentChat.meta.id && job.userId === userId;
            const jobChat = isCurrentChat ? currentChat : await Storage.getChat(job.userId, job.chatId);

            if (jobChat) {
                const jobAgent = isCurrentChat ? agent : new Agent(jobChat);
                try {
                    // Send system notification about cron trigger
                    const systemNotification = `[SYSTEM NOTIFICATION] Scheduled task triggered: "${job.prompt}"\n\nA cronjob you scheduled has been activated. You may now proceed with any actions you planned for this trigger.`;

                    const response = await jobAgent.run(systemNotification, { _ephemeral: true });

                    // Only publish the assistant's response if it exists
                    if (response && response.trim()) {
                        PubSub.publish(`chat:${jobChat.meta.id}`, {
                            type: "message",
                            message: { role: "assistant", content: response },
                            chatId: jobChat.meta.id,
                            userId: job.userId
                        });

                        if (isCurrentChat) {
                            await Logger.bot(response);
                            process.stdout.write(await Logger.prompt());
                        }
                    }
                } catch (e: any) {
                    await Logger.error(`Cron error: ${e.message}`);
                }
            }
        }
    };

    // Initial check and interval for CLI
    await processCronJobs();
    const cronInterval = setInterval(processCronJobs, 10000);

    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
        terminal: true,
    });

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
