import { commandManager } from "./command-manager";
import { Updater } from "../updater";

commandManager.register({
    name: "update",
    description: "System updates management",
    needRole: "root",
    subs: [
        {
            name: "check",
            description: "Check for available updates",
            handler: async () => {
                const result = await Updater.checkUpdates();
                if (result.updates.length === 0) {
                    if (result.channel === "development") {
                        return "Current channel is development. Use '/update now' to try a git pull.";
                    }
                    return `Your system is up to date on the ${result.channel} channel.`;
                }

                let response = `Found ${result.updates.length} update(s) on ${result.channel} channel:\n\n`;
                for (const update of result.updates) {
                    response += `- **${update.version}**: ${update.name} (${update.type})\n`;
                }
                return response;
            }
        },
        {
            name: "now",
            description: "Perform git pull to update the system",
            handler: async () => {
                const { stdout, stderr } = await Updater.performUpdate();
                if (stdout.includes("Already up to date")) {
                    return "System is already up to date.";
                }
                return `Update successful!\n\n**Output:**\n${stdout}\n${stderr ? `**Errors:**\n${stderr}` : ""}`;
            }
        },
        {
            name: "switch",
            description: "Switch between update channels (stable, nightly, development)",
            args: [
                {
                    name: "channel",
                    description: "The channel to switch to",
                    type: "string",
                    required: true,
                    choices: [
                        { name: "stable", value: "stable" },
                        { name: "nightly", value: "nightly" },
                        { name: "development", value: "development" }
                    ]
                }
            ],
            handler: async (args) => {
                const channel = args[0] as "stable" | "nightly" | "development";
                await Updater.switchChannel(channel);
                return `Successfully switched to ${channel} channel and updated code!`;
            }
        }
    ]
});
