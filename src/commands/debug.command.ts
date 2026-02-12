import { commandManager } from "./command-manager";
import { getUserSettingsFile } from "../data/storage";
import fs from "node:fs/promises";
import path from "node:path";

commandManager.register({
    name: "debug",
    description: "Toggle debug mode for verbose output",
    args: [
        {
            name: "mode",
            description: "Debug mode (on/off, or toggle if not specified)",
            type: "string",
            required: false,
            choices: [
                { name: "on", value: "on" },
                { name: "off", value: "off" }
            ]
        }
    ],
    handler: async (args, { user }) => {
        const file = getUserSettingsFile(user.id);
        const current = await fs.readFile(file, "utf-8").then(c => JSON.parse(c)).catch(() => ({}));

        let newValue: boolean;
        if (args[0] === "on") newValue = true;
        else if (args[0] === "off") newValue = false;
        else {
            // Toggle
            const currentVal = current.debug !== undefined ? current.debug : false;
            newValue = !currentVal;
        }

        current.debug = newValue;

        await fs.mkdir(path.dirname(file), { recursive: true });
        await fs.writeFile(file, JSON.stringify(current, null, 4), "utf-8");

        return `Debug mode is now ${newValue ? 'ON' : 'OFF'}.`;
    }
});
