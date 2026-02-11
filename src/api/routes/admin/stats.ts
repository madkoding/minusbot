import express from "express";
import os from "node:os";
import fs from "node:fs/promises";
import { UserManager } from "../../../users";
import { SkillManager } from "../../../skills";
import { StatsManager } from "../../../stats";

const router = express.Router();

router.get("/", async (req: any, res) => {
    const memory = process.memoryUsage();
    const uptime = process.uptime();
    const users = UserManager.getUsers().length;
    const skills = (await SkillManager.listSkills(req.user?.id)).length;
    const usage = await StatsManager.getStats();

    const stats = await fs.statfs("/");
    const diskTotal = Number(stats.blocks * stats.bsize);
    const diskFree = Number(stats.bfree * stats.bsize);
    const diskUsed = diskTotal - diskFree;

    res.json({
        ...usage,
        memory: {
            rss: memory.rss,
            heapUsed: memory.heapUsed,
            heapTotal: memory.heapTotal
        },
        cpu: os.loadavg()[0],
        uptime,
        users,
        skills,
        disk: {
            total: diskTotal,
            used: diskUsed,
            free: diskFree
        },
        platform: os.platform(),
        arch: os.arch()
    });
});

export default router;
