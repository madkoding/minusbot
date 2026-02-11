import bcrypt from "bcrypt";
import { UserManager } from "../src/users";
import { Logger } from "../src/colors";

async function regenerateRoot() {
    console.log("\x1b[36m󱙺\x1b[0m Regenerating root password...");

    try {
        await UserManager.init();

        const rootUser = UserManager.getUserById("root");
        if (!rootUser) {
            console.error("\x1b[31m✘ Error: Root user not found.\x1b[0m");
            return;
        }

        const newPass = Math.random().toString(36).substring(2, 10) + Math.random().toString(36).substring(2, 10);
        const passwordHash = await bcrypt.hash(newPass, 10);

        await UserManager.updateUser("root", { passwordHash });

        console.log(`\n\x1b[32m✔ Successfully regenerated root password!\x1b[0m`);
        console.log(`\x1b[33m󱙺\x1b[0m New Root Password: \x1b[1m${newPass}\x1b[0m`);
        console.log("\x1b[31m⚠ Please save this password immediately!\x1b[0m");
    } catch (e: any) {
        console.error(`\n\x1b[31m✘ Fatal error: ${e.message}\x1b[0m`);
    }
}

regenerateRoot();
