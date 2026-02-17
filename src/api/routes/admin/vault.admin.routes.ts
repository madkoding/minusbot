import express from "express";
import fs from "node:fs/promises";

import { SHARED_SECRETS_DIR } from "@/data/storage";
import { secrets } from "@/secrets";

import { validate } from "@/api/middleware/validate.middleware";
import { UpdateVaultKeyDTO } from "@/api/dto/vault.dto";

const router = express.Router();

router.get("/", async (req, res) => {
    const vaults = await fs.readdir(SHARED_SECRETS_DIR).catch(() => []);
    const names = vaults.map(v => v.replace(".env", ""));
    res.json(names);
});

router.get("/:id", async (req, res) => {
    const vault = await secrets.globalVault(req.params.id);
    res.json(vault.maskedValues());
});

router.put("/:id", validate(UpdateVaultKeyDTO), async (req, res) => {
    const vault = await secrets.globalVault(req.params.id as string);
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
