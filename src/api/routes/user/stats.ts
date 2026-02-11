import express from "express";
import { StatsManager } from "../../../stats";

const router = express.Router();

router.get("/", async (req: any, res) => {
    // Return user-specific stats
    res.json(await StatsManager.getStats(req.user.id));
});

export default router;
