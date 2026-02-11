import express from "express";
import path from "node:path";
import fs from "node:fs/promises";
import { SkillManager } from "../../../skills";

const router = express.Router();

router.get("/", async (req: any, res) => {
    // List both user and global skills (user can see both)
    res.json(await SkillManager.listSkills(req.user.id));
});

router.get("/:id", async (req: any, res) => {
    const skill = await SkillManager.getSkill(req.user.id, req.params.id);
    if (!skill) return res.status(404).send("Skill not found");

    const skillDir = skill.isGlobal
        ? path.join(process.env.SHARED_SKILLS_DIR || "", req.params.id) // This needs careful path handling
        : path.join(SkillManager.getUserSkillsDir(req.user.id), req.params.id);

    // For simplicity, we assume we want to read the files
    // But user routes shouldn't probably allow editing GLOBAL skills.
    try {
        const skillJson = skill.definition;
        const scriptPy = await fs.readFile(path.join(SkillManager.getUserSkillsDir(req.user.id), req.params.id, "script.py"), "utf-8").catch(() => "");
        res.json({ id: req.params.id, skillJson, scriptPy, isGlobal: skill.isGlobal });
    } catch {
        res.status(404).send("Skill files not found");
    }
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
