import express from "express";
import os from "node:os";
import fs from "node:fs/promises";

import { UserManager } from "@/users";
import { SkillManager } from "@/skills";
import { StatsManager } from "@/stats";

const router = express.Router();

router.get("/", async (req: any, res) => {
    const uptime = os.uptime();
    const users = UserManager.getUsers().length;
    const usage = await StatsManager.getStats();

    const stats = await fs.statfs("/");
    const diskTotal = Number(stats.blocks * stats.bsize);
    const diskFree = Number(stats.bfree * stats.bsize);
    const diskUsed = diskTotal - diskFree;

    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;

    // CPU usage is async in most libraries, for now let's use loadavg or a simple placeholder 
    // unless we want to wait. Let's just use loadavg for simplified metrics or 0 for windows.
    const cpuUsage = os.platform() === 'win32' ? 0 : os.loadavg()[0];

    res.json({
        ...usage,
        memory: {
            total: totalMem,
            used: usedMem,
            free: freeMem,
            percentage: (usedMem / totalMem) * 100
        },
        cpu: cpuUsage,
        uptime,
        users,
        disk: {
            total: diskTotal,
            used: diskUsed,
            free: diskFree,
            percentage: (diskUsed / diskTotal) * 100
        },
        platform: os.platform(),
        arch: os.arch()
    });
});

export default router;
