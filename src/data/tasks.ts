import fs from "node:fs/promises";
import path from "node:path";

import { getUserDir, USERS_DIR } from "./storage";

export interface CronJob {
    id: string;
    chatId: string;
    userId: string;
    triggerAt: string; // ISO string - for one-time jobs or next execution for recurring
    prompt: string;
    type: "async" | "sync";
    recurring?: boolean; // If true, reschedule after execution
    interval?: number; // Interval in milliseconds for recurring jobs
    lastExecuted?: string; // ISO string of last execution time
}

export class TaskManager {
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
                const due: CronJob[] = [];
                const remaining: CronJob[] = [];

                for (const job of jobs) {
                    if (new Date(job.triggerAt) <= now) {
                        dueJobs.push(job);
                        due.push(job);

                        // If recurring, reschedule
                        if (job.recurring && job.interval) {
                            const nextTrigger = new Date(now.getTime() + job.interval);
                            remaining.push({
                                ...job,
                                triggerAt: nextTrigger.toISOString(),
                                lastExecuted: now.toISOString()
                            });
                        }
                        // Otherwise, one-time job is removed
                    } else {
                        remaining.push(job);
                    }
                }

                if (due.length > 0) {
                    await this.save(userId, remaining);
                }
            }
        } catch { }
        return dueJobs;
    }
}
