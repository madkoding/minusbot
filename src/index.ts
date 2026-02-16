import { Logger } from "./cli/colors";
import { UserManager } from "./data/users";
import { ChannelManager } from "./channels";
import { ensureDirs } from "./data/storage";
import { startServer } from "./api/index";
import { runCLI } from "./cli/repl"; // This handles the CLI loop and cron jobs for now
import { Updater } from "./updater";

async function main() {
    console.log("Starting engine components...");
    await ensureDirs();
    await UserManager.init();
    await Updater.init();
    console.log("Users module initialized.");

    const pkg = await Bun.file("package.json").json();
    await Logger.banner(pkg.version);

    await startServer();

    await Logger.info("Booting channels...");
    await ChannelManager.init();

    const args = process.argv.slice(2);
    let chatId = args.find(a => !a.startsWith("--"));
    const isPermanent = args.includes("--permanent");

    // CLI always acts as 'root' user
    const userId = "root";

    // Pass control to the CLI REPL
    await runCLI(chatId || null, userId, isPermanent);
}

main().catch(async (e) => {
    await Logger.error(`Fatal crash: ${e.message}`);
});
