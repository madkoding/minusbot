import express from "express";
import fs from "node:fs/promises";
import { SHARED_SECRETS_DIR } from "../../../config";
import { secrets } from "../../../secrets";

const router = express.Router();

router.get("/", async (req, res) => {
    const vaults = await fs.readdir(SHARED_SECRETS_DIR).catch(() => []);
    res.json(vaults.map(v => v.replace(".env", "")));
});

router.get("/:id", async (req, res) => {
    const vault = await secrets.globalVault(req.params.id);
    const keys = vault.listKeys();
    const data: any = {};
    for (const k of keys) data[k] = "******";
    res.json(data);
});

router.put("/:id", async (req, res) => {
    const vault = await secrets.globalVault(req.params.id);
    const { key, value } = req.body;
    await vault.set(key, value);
    res.send("Global secret updated");
});

router.delete("/:id/:key", async (req, res) => {
    const vault = await secrets.globalVault(req.params.id);
    await vault.delete(req.params.key);
    res.send("Global secret deleted");
});

export default router;
