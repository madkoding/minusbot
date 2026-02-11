import express from "express";
import path from "node:path";
import fs from "node:fs/promises";

import { SHARED_SKILLS_DIR } from "@/data/storage";
import { SkillManager } from "@/data/skills";

import { secrets } from "@/secrets";

const router = express.Router();

router.get("/", async (req: any, res) => {
    try {
        const skills = await SkillManager.listSkills(); // Global only
        res.json(skills.map(s => ({
            id: s.id,
            enabled: s.enabled,
            isGlobal: true,
            definition: s.definition
        })));
    } catch {
        res.json([]);
    }
});

router.get("/:id", async (req: any, res) => {
    try {
        const skill = await SkillManager.getSkill("", req.params.id);
        if (!skill) return res.status(404).send("Global skill not found");

        const skillDir = path.join(SHARED_SKILLS_DIR, req.params.id);
        const scriptPy = await fs.readFile(path.join(skillDir, "script.py"), "utf-8").catch(() => "");

        res.json({
            id: req.params.id,
            skillJson: skill.definition,
            scriptPy,
            isGlobal: true,
            enabled: skill.enabled
        });
    } catch (e) {
        res.status(404).send("Error loading skill");
    }
});

router.get("/:id/vault", async (req: any, res) => {
    const vaultId = `skill-${req.params.id}`;
    const vault = await secrets.globalVault(vaultId);
    res.json(vault.maskedValues());
});

router.put("/:id/vault", async (req: any, res) => {
    const vaultId = `skill-${req.params.id}`;
    const vault = await secrets.globalVault(vaultId);
    const { key, value } = req.body;
    await vault.set(key, value);
    res.send("Global skill secret updated");
});

// Toggle global skill
router.post("/:id/toggle", async (req, res) => {
    try {
        const skill = await SkillManager.getSkill("", req.params.id);
        if (!skill) return res.status(404).send("Global skill not found");

        skill.definition.enabled = !skill.definition.enabled;

        const skillDir = path.join(SHARED_SKILLS_DIR, req.params.id);
        await fs.writeFile(path.join(skillDir, "skill.json"), JSON.stringify(skill.definition, null, 4));

        res.json({ enabled: skill.definition.enabled });
    } catch {
        res.status(500).send("Failed to toggle skill");
    }
});

router.post("/", async (req, res) => {
    const { id, skillJson, scriptPy } = req.body;
    const skillDir = path.join(SHARED_SKILLS_DIR, id);
    await fs.mkdir(skillDir, { recursive: true });
    await fs.writeFile(path.join(skillDir, "skill.json"), JSON.stringify(skillJson, null, 4));
    if (scriptPy !== undefined) {
        await fs.writeFile(path.join(skillDir, "script.py"), scriptPy);
    }
    res.send("Global skill saved");
});

router.delete("/:id", async (req, res) => {
    const skillDir = path.join(SHARED_SKILLS_DIR, req.params.id);
    await fs.rm(skillDir, { recursive: true, force: true });
    res.send("Global skill deleted");
});

export default router;
