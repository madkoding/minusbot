import express from "express";
import path from "node:path";
import fs from "node:fs/promises";

import { SkillManager } from "@/data/skills";

import { secrets } from "@/secrets";
import { IntegrationManager } from "@/integrations/integration-manager";

const router = express.Router();

router.get("/", async (req: any, res) => {
    // List both user and global skills (user can see both)
    res.json(await SkillManager.listSkills(req.user.id));
});

router.get("/:id", async (req: any, res) => {
    const skill = await SkillManager.getSkill(req.user.id, req.params.id);
    if (!skill) return res.status(404).send("Skill not found");

    try {
        const skillJson = skill.definition;
        const scriptPy = await fs.readFile(path.join(SkillManager.getUserSkillsDir(req.user.id), req.params.id, "script.py"), "utf-8").catch(() => "");
        res.json({ id: req.params.id, skillJson, scriptPy, isGlobal: skill.isGlobal });
    } catch {
        res.status(404).send("Skill files not found");
    }
});

router.get("/:id/vault", async (req: any, res) => {
    const vaultId = `skill-${req.params.id}`;
    const vault = await secrets.vault(req.user.id, vaultId);
    res.json(vault.maskedValues());
});

router.put("/:id/vault", async (req: any, res) => {
    const vaultId = `skill-${req.params.id}`;
    const vault = await secrets.userVault(req.user.id, vaultId);
    const { key, value } = req.body;
    await vault.set(key, value);

    // Skill vault changes might need reloading if the agent is long-lived and caches env
    // For now we use the same reload logic as integrations
    await IntegrationManager.reloadUser(req.user.id);

    res.send("Skill secret updated");
});

router.post("/", async (req: any, res) => {
    const { id, skillJson, scriptPy } = req.body;
    const skillDir = path.join(SkillManager.getUserSkillsDir(req.user.id), id);
    await fs.mkdir(skillDir, { recursive: true });
    await fs.writeFile(path.join(skillDir, "skill.json"), JSON.stringify(skillJson, null, 4));
    if (scriptPy !== undefined) {
        await fs.writeFile(path.join(skillDir, "script.py"), scriptPy);
    }
    res.send("Personal skill saved");
});

router.delete("/:id", async (req: any, res) => {
    const skill = await SkillManager.getSkill(req.user.id, req.params.id);
    if (skill?.isGlobal) {
        return res.status(403).send("Cannot delete global skills. Use settings to disable them for yourself.");
    }
    const skillDir = path.join(SkillManager.getUserSkillsDir(req.user.id), req.params.id);
    await fs.rm(skillDir, { recursive: true, force: true });
    res.send("Personal skill deleted");
});

export default router;
