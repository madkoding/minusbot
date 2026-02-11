import express from "express";
import fs from "node:fs/promises";
import path from "node:path";

import { getUserSettings, getUserSettingsFile } from "@/data/storage";
import { validate } from "@/api/middleware/validate.middleware";
import { UserSettingsDTO, ToggleToolDTO, ToggleSkillDTO } from "@/api/dto/settings.dto";

const router = express.Router();

router.get("/", async (req: any, res) => {
    res.json(await getUserSettings(req.user.id));
});

router.put("/", validate(UserSettingsDTO), async (req: any, res) => {
    const file = getUserSettingsFile(req.user.id);
    await fs.mkdir(path.dirname(file), { recursive: true });
    await fs.writeFile(file, JSON.stringify(req.body, null, 4), "utf-8");
    res.send("Personal settings updated");
});

router.post("/toggle-tool", validate(ToggleToolDTO), async (req: any, res) => {
    const { name } = req.body;
    const settings = await getUserSettings(req.user.id);
    const file = getUserSettingsFile(req.user.id);
    const userContent = JSON.parse(await fs.readFile(file, "utf-8").catch(() => "{}"));

    const disabled = settings.disabled_tools || [];
    const newDisabled = disabled.includes(name)
        ? disabled.filter(t => t !== name)
        : [...disabled, name];

    userContent.disabled_tools = newDisabled;
    await fs.writeFile(file, JSON.stringify(userContent, null, 4), "utf-8");
    res.json({ ...settings, disabled_tools: newDisabled });
});

router.post("/toggle-skill", validate(ToggleSkillDTO), async (req: any, res) => {
    const { id } = req.body;
    const settings = await getUserSettings(req.user.id);
    const file = getUserSettingsFile(req.user.id);
    const userContent = JSON.parse(await fs.readFile(file, "utf-8").catch(() => "{}"));

    const disabled = settings.disabled_skills || [];
    const newDisabled = disabled.includes(id)
        ? disabled.filter(s => s !== id)
        : [...disabled, id];

    userContent.disabled_skills = newDisabled;
    await fs.writeFile(file, JSON.stringify(userContent, null, 4), "utf-8");
    res.json({ ...settings, disabled_skills: newDisabled });
});

export default router;
