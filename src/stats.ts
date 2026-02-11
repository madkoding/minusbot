import fs from "node:fs/promises";
import path from "node:path";

import { SHARED_DIR, getUserDir } from "./config";

export interface StatsData {
    chats_created: number;
    messages_sent: number;
    tokens_input: number;
    tokens_output: number;
}

export class StatsManager {
    private static getStatsDir(userId?: string) {
        if (userId) return path.join(getUserDir(userId), "stats");
        return path.join(SHARED_DIR, "stats");
    }

    private static async getFile(userId?: string, date?: string): Promise<string> {
        const dir = this.getStatsDir(userId);
        await fs.mkdir(dir, { recursive: true });
        return path.join(dir, `${date || "total"}.json`);
    }

    private static async load(userId?: string, date?: string): Promise<StatsData> {
        const file = await this.getFile(userId, date);
        try {
            const content = await fs.readFile(file, "utf-8");
            return JSON.parse(content);
        } catch {
            return {
                chats_created: 0,
                messages_sent: 0,
                tokens_input: 0,
                tokens_output: 0
            };
        }
    }

    private static async save(data: StatsData, userId?: string, date?: string) {
        const file = await this.getFile(userId, date);
        await fs.writeFile(file, JSON.stringify(data, null, 4), "utf-8");
    }

    private static async updateOne(userId: string | undefined, updater: (data: StatsData) => void) {
        const today = new Date().toISOString().split("T")[0];

        // Update Total
        const total = await this.load(userId);
        updater(total);
        await this.save(total, userId);

        // Update Daily
        const daily = await this.load(userId, today);
        updater(daily);
        await this.save(daily, userId, today);
    }

    static async update(userId: string, updater: (data: StatsData) => void) {
        // Update user stats
        await this.updateOne(userId, updater);
        // Update global stats
        await this.updateOne(undefined, updater);
    }

    static async trackChatCreated(userId: string) {
        await this.update(userId, d => d.chats_created++);
    }

    static async trackMessageSent(userId: string) {
        await this.update(userId, d => d.messages_sent++);
    }

    static async trackTokens(userId: string, input: number, output: number) {
        await this.update(userId, d => {
            d.tokens_input += input;
            d.tokens_output += output;
        });
    }

    static async getStats(userId?: string, date?: string): Promise<StatsData> {
        return await this.load(userId, date);
    }
}
