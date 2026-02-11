import fs from "node:fs/promises";
import path from "node:path";

import { SHARED_SKILLS_DIR } from "@/data/storage";

const REPO_SKILLS_DIR = path.join(process.cwd(), "skills");

async function installSkills() {
    console.log(`\x1b[36m󱙺\x1b[0m Installing skills from: \x1b[33m${REPO_SKILLS_DIR}\x1b[0m`);
    console.log(`\x1b[36m󱙺\x1b[0m To: \x1b[33m${SHARED_SKILLS_DIR}\x1b[0m`);

    try {
        // Ensure destination exists
        await fs.mkdir(SHARED_SKILLS_DIR, { recursive: true });

        // Read repo skills
        const skills = await fs.readdir(REPO_SKILLS_DIR);

        let installedCount = 0;

        for (const skill of skills) {
            const src = path.join(REPO_SKILLS_DIR, skill);
            const dest = path.join(SHARED_SKILLS_DIR, skill);

            const stats = await fs.stat(src);
            if (stats.isDirectory()) {
                // Check if skill.json exists
                try {
                    await fs.access(path.join(src, "skill.json"));
                    console.log(`  \x1b[32m✔\x1b[0m Installing \x1b[1m${skill}\x1b[0m...`);
                    await fs.cp(src, dest, { recursive: true });
                    installedCount++;
                } catch {
                    console.log(`  \x1b[31m✘\x1b[0m Skipping \x1b[1m${skill}\x1b[0m (missing skill.json)`);
                }
            }
        }

        if (installedCount === 0) {
            console.log("\n\x1b[33m⚠ No skills were found to install.\x1b[0m");
        } else {
            console.log(`\n\x1b[32m✔ Successfully installed ${installedCount} skills!\x1b[0m`);
        }
    } catch (e: any) {
        console.error(`\n\x1b[31m✘ Fatal error: ${e.message}\x1b[0m`);
    }
}

installSkills();
