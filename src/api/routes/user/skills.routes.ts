import express from "express";
import path from "node:path";
import fs from "node:fs/promises";

import { SHARED_SKILLS_DIR } from "@/data/storage";
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
        const skillJson = skill.definition as any;
        res.json({ id: req.params.id, skillJson, isGlobal: skill.isGlobal });
    } catch {
        res.status(404).send("Skill files not found");
    }
});

router.get("/:id/vault", async (req: any, res) => {
    const vaultId = `skill_${req.params.id}`;
    const vault = await secrets.vault(req.user.id, vaultId);
    res.json(vault.maskedValues());
});

router.put("/:id/vault", async (req: any, res) => {
    const vaultId = `skill_${req.params.id}`;
    const vault = await secrets.userVault(req.user.id, vaultId);
    const { key, value } = req.body;
    await vault.set(key, value);
    await IntegrationManager.reloadUser(req.user.id);
    res.send("Skill secret updated");
});

// --- User-specific Data and Config ---

router.get("/:id/config", async (req: any, res) => {
    const { getUserIntegrationConfigFile } = await import("@/data/storage");
    const configFile = getUserIntegrationConfigFile(req.user.id, `skill_${req.params.id}`);
    try {
        const content = await fs.readFile(configFile, "utf-8");
        res.json(JSON.parse(content));
    } catch {
        res.json({});
    }
});

router.put("/:id/config", async (req: any, res) => {
    const { getUserIntegrationConfigFile } = await import("@/data/storage");
    const configFile = getUserIntegrationConfigFile(req.user.id, `skill_${req.params.id}`);
    await fs.mkdir(path.dirname(configFile), { recursive: true });
    await fs.writeFile(configFile, JSON.stringify(req.body, null, 4));
    res.send("User config updated");
});

router.get("/:id/data", async (req: any, res) => {
    const files = await SkillManager.listSkillFiles(req.user.id, req.params.id);
    res.json(files);
});

router.get("/:id/data/:filename", async (req: any, res) => {
    const content = await SkillManager.getSkillFile(req.user.id, req.params.id, req.params.filename);
    res.json({ content });
});

router.put("/:id/data/:filename", async (req: any, res) => {
    await SkillManager.saveSkillFile(req.user.id, req.params.id, req.params.filename, req.body.content);
    res.send("Skill data saved");
});

// --- Script and Definition Management ---

router.get("/:id/scripts", async (req: any, res) => {
    const skill = await SkillManager.getSkill(req.user.id, req.params.id);
    if (!skill) return res.status(404).send("Skill not found");

    const skillDir = skill.isGlobal ? path.join(SHARED_SKILLS_DIR, req.params.id) : path.join(SkillManager.getUserSkillsDir(req.user.id), req.params.id);
    const scriptsDir = path.join(skillDir, "scripts");

    try {
        const files = await fs.readdir(scriptsDir);
        res.json(files);
    } catch {
        res.json([]);
    }
});

router.get("/:id/scripts/:filename", async (req: any, res) => {
    const skill = await SkillManager.getSkill(req.user.id, req.params.id);
    if (!skill) return res.status(404).send("Skill not found");

    const skillDir = skill.isGlobal ? path.join(SHARED_SKILLS_DIR, req.params.id) : path.join(SkillManager.getUserSkillsDir(req.user.id), req.params.id);
    const filePath = path.join(skillDir, "scripts", req.params.filename);

    try {
        const content = await fs.readFile(filePath, "utf-8");
        res.json({ content });
    } catch {
        res.status(404).send("File not found");
    }
});

router.post("/", async (req: any, res) => {
    const { id, skillJson, scripts } = req.body; // scripts is Record<filename, content>
    const skillDir = path.join(SkillManager.getUserSkillsDir(req.user.id), id);
    await fs.mkdir(skillDir, { recursive: true });
    await fs.writeFile(path.join(skillDir, "skill.json"), JSON.stringify(skillJson, null, 4));

    if (scripts) {
        const scriptsDir = path.join(skillDir, "scripts");
        await fs.mkdir(scriptsDir, { recursive: true });
        for (const [filename, content] of Object.entries(scripts)) {
            await fs.writeFile(path.join(scriptsDir, filename), content as string);
        }
    }
    res.send("Personal skill saved");
});

router.put("/:id/scripts/:filename", async (req: any, res) => {
    const skill = await SkillManager.getSkill(req.user.id, req.params.id);
    if (!skill || skill.isGlobal) return res.status(403).send("Forbidden");

    const skillDir = path.join(SkillManager.getUserSkillsDir(req.user.id), req.params.id);
    const filePath = path.join(skillDir, "scripts", req.params.filename);
    await fs.writeFile(filePath, req.body.content);
    res.send("Script updated");
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
