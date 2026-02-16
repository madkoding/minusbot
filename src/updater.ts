import fs from "node:fs/promises";
import semver from "semver";
import { exec } from "node:child_process";
import { promisify } from "node:util";

import { Logger } from "./cli/colors";
import { getSystemSettings, SYSTEM_SETTINGS_FILE } from "./data/storage";

const execAsync = promisify(exec);

export interface UpdateEntry {
    version: string;
    changes: string[];
    name: string;
    type: "update" | "securitypatch" | "hotfix";
}

export class Updater {
    static async init() {
        // Periodic check every 24 hours
        setInterval(() => {
            this.checkAndLog();
        }, 24 * 60 * 60 * 1000);

        // Initial check
        this.checkAndLog();
    }

    private static async checkAndLog() {
        try {
            const settings = await getSystemSettings();
            const result = await this.checkUpdates();

            if (result.updates && result.updates.length > 0) {
                await Logger.info(`[Updater] New update available: ${result.updates[0]?.version} (${settings.updater_channel})`);
            } else if (settings.updater_channel === "development") {
                try {
                    await execAsync("git fetch");
                    const { stdout } = await execAsync("git status -uno");
                    if (stdout.includes("Your branch is behind")) {
                        await Logger.info(`[Updater] Development updates are available (git pull recommended)`);
                    }
                } catch (e) {
                    // Git error, maybe not in a git repo?
                }
            }
        } catch (e: any) {
            await Logger.error(`[Updater] Error checking updates: ${e.message}`);
        }
    }

    static async getCurrentVersion(): Promise<string> {
        try {
            const pkg = JSON.parse(await fs.readFile("package.json", "utf-8"));
            return pkg.version;
        } catch {
            return "0.0.0";
        }
    }

    static async getCurrentBranch(): Promise<string> {
        try {
            const { stdout } = await execAsync("git branch --show-current");
            return stdout.trim();
        } catch {
            return "unknown";
        }
    }

    static async checkUpdates() {
        const settings = await getSystemSettings();

        if (settings.updater_channel === "development") {
            return { channel: "development", updates: [] };
        }

        const url = settings.updater_channel === "stable" ? settings.updater_stable_url : settings.updater_nightly_url;

        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error(`Failed to fetch updates from ${url}`);

            const allVersions = await response.json() as UpdateEntry[];
            const currentVersion = await this.getCurrentVersion();

            const updates = allVersions
                .filter(v => semver.gt(v.version, currentVersion))
                .sort((a, b) => semver.compare(b.version, a.version));

            return {
                channel: settings.updater_channel,
                updates
            };
        } catch (e: any) {
            throw new Error(`Update check failed: ${e.message}`);
        }
    }

    static async performUpdate() {
        const { stdout, stderr } = await execAsync("git pull");
        return { stdout, stderr };
    }

    static async switchChannel(channel: "stable" | "nightly" | "development") {
        const settings = await getSystemSettings();
        settings.updater_channel = channel;

        // Save settings
        await fs.writeFile(SYSTEM_SETTINGS_FILE, JSON.stringify(settings, null, 4), "utf-8");

        // Git switch
        try {
            await execAsync(`git checkout ${channel}`);
            await execAsync("git pull");
        } catch (e: any) {
            await Logger.error(`[Updater] Git switch failed: ${e.message}`);
            throw e;
        }
    }
}
