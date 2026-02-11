import express from "express";
import fs from "node:fs/promises";
import path from "node:path";

import { getUserDir } from "@/data/storage";
import { secrets } from "@/secrets";

import { IntegrationManager } from "@/integrations/integration-manager";
import { validate } from "@/api/middleware/validate.middleware";
import { UpdateVaultKeyDTO } from "@/api/dto/vault.dto";

const router = express.Router();

router.get("/", async (req: any, res) => {
    const userSecretsDir = path.join(getUserDir(req.user.id), "secrets");
    const vaults = await fs.readdir(userSecretsDir).catch(() => []);
    const names = vaults.map(v => v.replace(".env", ""));

    // Ensure default vaults are always visible
    const defaults = ["agent", "integration-telegram"];
    for (const d of defaults) {
        if (!names.includes(d)) names.push(d);
    }

    res.json(names);
});

router.get("/:id", async (req: any, res) => {
    // We show the merged list of keys and their masked status
    const vault = await secrets.vault(req.user.id, req.params.id);
    res.json(vault.maskedValues());
});

router.put("/:id", validate(UpdateVaultKeyDTO), async (req: any, res) => {
    const vault = await secrets.userVault(req.user.id, req.params.id);
    const { key, value } = req.body;
    await vault.set(key, value);

    if (req.params.id.startsWith("integration-") || req.params.id.startsWith("skill-")) {
        await IntegrationManager.reloadUser(req.user.id);
    }

    res.send("Personal secret updated");
});

router.delete("/:id/:key", async (req: any, res) => {
    const vault = await secrets.userVault(req.user.id, req.params.id);
    await vault.delete(req.params.key);

    if (req.params.id.startsWith("integration-") || req.params.id.startsWith("skill-")) {
        await IntegrationManager.reloadUser(req.user.id);
    }

    res.send("Personal secret deleted (falling back to global)");
});

export default router;
