import { Router } from "express";
import { Updater } from "../../../updater";
import { getSystemSettings } from "../../../data/storage";

const router = Router();

// Get status and available updates
router.get("/status", async (req, res) => {
    try {
        const settings = await getSystemSettings();
        const currentVersion = await Updater.getCurrentVersion();
        const currentBranch = await Updater.getCurrentBranch();
        const checkResult = await Updater.checkUpdates();

        res.json({
            currentVersion,
            currentBranch,
            channel: settings.updater_channel,
            updates: checkResult.updates
        });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Check for updates manually
router.post("/check", async (req, res) => {
    try {
        const result = await Updater.checkUpdates();
        res.json(result);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Perform update (git pull)
router.post("/now", async (req, res) => {
    try {
        const result = await Updater.performUpdate();
        res.json(result);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Switch branch/channel
router.post("/switch", async (req, res) => {
    const { branch } = req.body;
    if (!branch) return res.status(400).json({ error: "Branch is required" });

    try {
        await Updater.switchChannel(branch);
        res.json({ success: true, branch });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
