import express from "express";
import fs from "node:fs/promises";

import { SHARED_SECRETS_DIR } from "@/data/storage";
import { secrets } from "@/secrets";

import { IntegrationManager } from "@/integrations/integration-manager";

const router = express.Router();

router.get("/", async (req, res) => {
    const vaults = await fs.readdir(SHARED_SECRETS_DIR).catch(() => []);
    const names = vaults.map(v => v.replace(".env", ""));

    // Ensure default global vaults are always visible
    const defaults = ["agent", "integration-telegram"];
    for (const d of defaults) {
        if (!names.includes(d)) names.push(d);
    }

    res.json(names);
});

router.get("/:id", async (req, res) => {
    const vault = await secrets.globalVault(req.params.id);
    res.json(vault.maskedValues());
});

router.put("/:id", async (req, res) => {
    const vault = await secrets.globalVault(req.params.id);
    const { key, value } = req.body;
    await vault.set(key, value);

    if (req.params.id === "integration-telegram") {
        await IntegrationManager.reloadGlobal();
    }

    res.send("Global secret updated");
});

router.delete("/:id/:key", async (req, res) => {
    const vault = await secrets.globalVault(req.params.id);
    await vault.delete(req.params.key);

    if (req.params.id === "integration-telegram") {
        await IntegrationManager.reloadGlobal();
    }

    res.send("Global secret deleted");
});

export default router;
