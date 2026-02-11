import path from "node:path";
import fs from "node:fs/promises";
import { getUserDir } from "./config";

export interface MemoEntry {
    value: string;
    important: boolean;
}

export interface MemoStore {
    [key: string]: MemoEntry | string; // Backwards compatibility for string values
}

export class MemoManager {
    static getMemoFile(userId: string) {
        return path.join(getUserDir(userId), "memo.json");
    }

    static async loadMemos(userId: string): Promise<MemoStore> {
        const file = this.getMemoFile(userId);
        try {
            const content = await fs.readFile(file, "utf-8");
            return JSON.parse(content);
        } catch {
            return {};
        }
    }

    static async saveMemos(userId: string, memos: MemoStore) {
        const file = this.getMemoFile(userId);
        await fs.mkdir(path.dirname(file), { recursive: true });
        await fs.writeFile(file, JSON.stringify(memos, null, 4), "utf-8");
    }

    static async put(userId: string, key: string, value: string, important: boolean = false) {
        const memos = await this.loadMemos(userId);
        memos[key] = { value, important };
        await this.saveMemos(userId, memos);
    }

    static async delete(userId: string, key: string) {
        const memos = await this.loadMemos(userId);
        if (memos[key]) {
            delete memos[key];
            await this.saveMemos(userId, memos);
            return true;
        }
        return false;
    }

    static async clear(userId: string) {
        await this.saveMemos(userId, {});
    }

    static async getImportantMemos(userId: string): Promise<Record<string, string>> {
        const memos = await this.loadMemos(userId);
        const important: Record<string, string> = {};

        for (const [key, entry] of Object.entries(memos)) {
            if (typeof entry === "string") continue; // Skip old format or consider not important
            if (entry.important) {
                important[key] = entry.value;
            }
        }

        return important;
    }

    static async query(userId: string, searchTerms?: string[]): Promise<Record<string, string>> {
        const memos = await this.loadMemos(userId);
        const result: Record<string, string> = {};

        // Helper to get string value
        const getValue = (entry: MemoEntry | string) => typeof entry === "string" ? entry : entry.value;

        if (!searchTerms || searchTerms.length === 0) {
            // Return all as simple key-value
            for (const [key, entry] of Object.entries(memos)) {
                result[key] = getValue(entry);
            }
            return result;
        }

        // Normalize search terms to lowercase for case-insensitive search
        const terms = searchTerms.map(t => t.toLowerCase());

        for (const [key, entry] of Object.entries(memos)) {
            const value = getValue(entry);
            const keyLower = key.toLowerCase();
            const valueLower = value.toLowerCase();

            // Check if ANY of the search terms match either key or value
            const match = terms.some(term =>
                keyLower.includes(term) || valueLower.includes(term)
            );

            if (match) {
                result[key] = value;
            }
        }

        return result;
    }
}
