import express from "express";
import fs from "node:fs/promises";
import path from "node:path";
import { getUserDir } from "../../../config";
import { secrets } from "../../../secrets";

const router = express.Router();

router.get("/", async (req: any, res) => {
    const userSecretsDir = path.join(getUserDir(req.user.id), "secrets");
    const vaults = await fs.readdir(userSecretsDir).catch(() => []);
    res.json(vaults.map(v => v.replace(".env", "")));
});

router.get("/:id", async (req: any, res) => {
    // We show the merged list of keys but mask them
    const vault = await secrets.vault(req.user.id, req.params.id);
    const keys = vault.listKeys();
    const data: any = {};
    for (const k of keys) data[k] = "******";
    res.json(data);
});

router.put("/:id", async (req: any, res) => {
    const vault = await secrets.userVault(req.user.id, req.params.id);
    const { key, value } = req.body;
    await vault.set(key, value);
    res.send("Personal secret updated");
});

router.delete("/:id/:key", async (req: any, res) => {
    const vault = await secrets.userVault(req.user.id, req.params.id);
    await vault.delete(req.params.key);
    res.send("Personal secret deleted (falling back to global)");
});

export default router;
