import fs from "node:fs/promises";

import { CONFIG_DIR } from "./config";

export class ToolLogger {
    static async log(chatId: string, toolName: string, args: any, result: string) {
        const logPath = `${CONFIG_DIR}/tool_calls.log`;
        const entry = {
            timestamp: new Date().toISOString(),
            chatId,
            toolName,
            args,
            result: result.length > 500 ? result.substring(0, 500) + "..." : result
        };
        await fs.mkdir(CONFIG_DIR, { recursive: true });
        await fs.appendFile(logPath, JSON.stringify(entry) + "\n", "utf-8");
    }
}
