import fs from "node:fs/promises";
import path from "node:path";

import { getUserDir, USERS_DIR } from "./storage";
import { Logger } from "@/cli/colors";

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
    processing?: boolean; // Flag to prevent multi-instance execution
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
        await Logger.task(`Added task: ${job.id} (${JSON.stringify(job)})`);
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
                const dueInThisUser: CronJob[] = [];
                const updatedList: CronJob[] = [];

                for (const job of jobs) {
                    if (!job.processing && new Date(job.triggerAt) <= now) {
                        job.processing = true;
                        dueJobs.push({ ...job });
                        dueInThisUser.push(job);

                        if (job.recurring && job.interval) {
                            const nextTrigger = new Date(now.getTime() + job.interval);
                            updatedList.push({
                                ...job,
                                triggerAt: nextTrigger.toISOString(),
                                lastExecuted: now.toISOString(),
                                processing: false // Ready for next cycle
                            });
                        }
                    } else {
                        updatedList.push(job);
                    }
                }

                if (dueInThisUser.length > 0) {
                    await this.save(userId, updatedList);
                }
            }
        } catch { }
        return dueJobs;
    }
}
