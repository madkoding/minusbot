import { getUserDir, USERS_DIR } from "./config";
import fs from "node:fs/promises";
import path from "node:path";

export interface CronJob {
    id: string;
    chatId: string;
    userId: string;
    triggerAt: string; // ISO string
    prompt: string;
    type: "async" | "sync";
}

export class CronManager {
    static getCronFile(userId: string) {
        return path.join(getUserDir(userId), "cronjobs.json");
    }

    static async list(userId: string): Promise<CronJob[]> {
        try {
            const content = await fs.readFile(this.getCronFile(userId), "utf-8");
            return JSON.parse(content);
        } catch {
            return [];
        }
    }

    static async save(userId: string, jobs: CronJob[]) {
        await fs.mkdir(getUserDir(userId), { recursive: true });
        await fs.writeFile(this.getCronFile(userId), JSON.stringify(jobs, null, 2), "utf-8");
    }

    static async add(job: CronJob) {
        const jobs = await this.list(job.userId);
        jobs.push(job);
        await this.save(job.userId, jobs);
    }

    static async cancel(userId: string, id: string) {
        const jobs = await this.list(userId);
        const filtered = jobs.filter((j) => j.id !== id);
        await this.save(userId, filtered);
    }

    static async getAllDueJobs(): Promise<CronJob[]> {
        const dueJobs: CronJob[] = [];
        try {
            const userDirs = await fs.readdir(USERS_DIR);
            for (const userId of userDirs) {
                const jobs = await this.list(userId);
                const now = new Date();
                const due = jobs.filter((j) => new Date(j.triggerAt) <= now);
                const remaining = jobs.filter((j) => new Date(j.triggerAt) > now);

                if (due.length > 0) {
                    dueJobs.push(...due);
                    await this.save(userId, remaining);
                }
            }
        } catch { }
        return dueJobs;
    }
}
