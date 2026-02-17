import express from "express";
import fs from "node:fs/promises";

import {
    GLOBAL_SETTINGS_FILE,
    getGlobalSettings,
    SYSTEM_SETTINGS_FILE,
    getSystemSettings
} from "@/data/storage";
import { validate } from "@/api/middleware/validate.middleware";
import { GlobalSettingsDTO, SystemSettingsDTO, ToggleToolDTO } from "@/api/dto/settings.dto";

const router = express.Router();

// Global Settings (Admin)
router.get("/global", async (req, res) => {
    res.json(await getGlobalSettings());
});

router.put("/global", validate(GlobalSettingsDTO), async (req, res) => {
    await fs.writeFile(GLOBAL_SETTINGS_FILE, JSON.stringify(req.body, null, 4), "utf-8");
    res.send("Global settings updated");
});

// System Settings (Root only)
router.get("/system", async (req: any, res) => {
    if (req.user.role !== "root") return res.status(403).send("Root only");
    res.json(await getSystemSettings());
});

// Toggle global tool status
router.post("/toggle-global-tool", validate(ToggleToolDTO), async (req, res) => {
    const { name } = req.body;
    const settings = await getGlobalSettings();
    const disabled = settings.disabled_tools || [];

    const newDisabled = disabled.includes(name)
        ? disabled.filter(t => t !== name)
        : [...disabled, name];

    const current = JSON.parse(await fs.readFile(GLOBAL_SETTINGS_FILE, "utf-8").catch(() => "{}"));
    current.disabled_tools = newDisabled;

    await fs.writeFile(GLOBAL_SETTINGS_FILE, JSON.stringify(current, null, 4), "utf-8");
    res.json({ ...settings, disabled_tools: newDisabled });
});

router.put("/system", validate(SystemSettingsDTO), async (req: any, res) => {
    if (req.user.role !== "root") return res.status(403).send("Root only");
    const current = await getSystemSettings();
    const updated = { ...current, ...req.body };
    await fs.writeFile(SYSTEM_SETTINGS_FILE, JSON.stringify(updated, null, 4), "utf-8");
    res.send("System settings updated");
});

export default router;
