import { Router } from "express";
import fs from "node:fs/promises";

import { IntegrationManager } from "@/integrations/integration-manager";
import { getGlobalIntegrationConfigFile, getGlobalIntegrationsDir } from "@/data/storage";
import { secrets } from "@/secrets";

const router = Router();

// GET /api/admin/integrations - List all integrations and their global status
router.get("/", async (req, res) => {
    try {
        const available = IntegrationManager.AVAILABLE_INTEGRATIONS.map(I => {
            const temp = new (I as any)({} as any, {});
            return temp.schema;
        });

        const configs: Record<string, any> = {};
        for (const schema of available) {
            try {
                const configPath = getGlobalIntegrationConfigFile(schema.id);
                const content = await fs.readFile(configPath, "utf-8");
                configs[schema.id] = JSON.parse(content);
            } catch {
                configs[schema.id] = null;
            }
        }

        res.json({ data: { available, configs } });
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

// GET /api/admin/integrations/:id/vault - Get global vault keys for an integration
router.get("/:id/vault", async (req, res) => {
    try {
        const { id } = req.params;
        const IntegrationClass = IntegrationManager.AVAILABLE_INTEGRATIONS.find(I => {
            const temp = new (I as any)({} as any, {});
            return temp.id === id;
        });

        if (!IntegrationClass) {
            return res.status(404).json({ error: "Integration not found" });
        }

        const temp = new (IntegrationClass as any)({} as any, {});
        const schema = temp.schema;
        const vaultId = schema.vaultId || `integration-${id}`;
        const vault = await secrets.globalVault(vaultId);

        const vaultData: Record<string, string> = {};
        if (schema.vaultKeys) {
            for (const key of schema.vaultKeys) {
                vaultData[key] = vault.get(key) || "";
            }
        }

        res.json({ data: vaultData });
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

// PUT /api/admin/integrations/:id - Update global configuration
router.put("/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const config = req.body;

        const IntegrationClass = IntegrationManager.AVAILABLE_INTEGRATIONS.find(I => {
            const temp = new (I as any)({} as any, {});
            return temp.id === id;
        });

        if (!IntegrationClass) {
            return res.status(404).json({ error: "Integration not found" });
        }

        const configPath = getGlobalIntegrationConfigFile(id);
        const dir = getGlobalIntegrationsDir();
        await fs.mkdir(dir, { recursive: true });
        await fs.writeFile(configPath, JSON.stringify(config, null, 4), "utf-8");

        // Reload all integrations to apply global changes if needed
        // Note: Currently IntegrationManager doesn't merge global config into user instances,
        // but we might want to reload everything anyway.
        await IntegrationManager.reloadGlobal();

        res.json({ data: { success: true } });
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

// PUT /api/admin/integrations/:id/vault - Update global vault keys
router.put("/:id/vault", async (req, res) => {
    try {
        const { id } = req.params;
        const { secrets: secretsData } = req.body;

        const IntegrationClass = IntegrationManager.AVAILABLE_INTEGRATIONS.find(I => {
            const temp = new (I as any)({} as any, {});
            return temp.id === id;
        });

        if (!IntegrationClass) {
            return res.status(404).json({ error: "Integration not found" });
        }

        const temp = new (IntegrationClass as any)({} as any, {});
        const schema = temp.schema;
        const vaultId = schema.vaultId || `integration-${id}`;
        const vault = await secrets.globalVault(vaultId);

        if (schema.vaultKeys && secretsData) {
            for (const key of schema.vaultKeys) {
                if (secretsData[key] !== undefined) {
                    await vault.set(key, secretsData[key]);
                }
            }
        }

        // Reload all integrations to apply vault changes
        await IntegrationManager.reloadGlobal();

        res.json({ data: { success: true } });
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

// DELETE /api/admin/integrations/:id - Disable global integration
router.delete("/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const configPath = getGlobalIntegrationConfigFile(id);

        try {
            await fs.unlink(configPath);
            await IntegrationManager.reloadGlobal();
            res.json({ data: { success: true } });
        } catch {
            res.status(404).json({ error: "Integration not enabled globally" });
        }
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

export default router;
