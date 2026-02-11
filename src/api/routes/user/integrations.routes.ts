import express from "express";
import fs from "node:fs/promises";
import { IntegrationManager } from "@/integrations/integration-manager";
import { getUserIntegrationConfigFile } from "@/data/storage";

const router = express.Router();

router.get("/", async (req: any, res) => {
    const available = IntegrationManager.AVAILABLE_INTEGRATIONS.map(I => {
        const temp = new (I as any)({} as any, {});
        return temp.schema;
    });

    const configs: Record<string, any> = {};
    for (const schema of available) {
        try {
            const configPath = getUserIntegrationConfigFile(req.user.id, schema.id);
            const content = await fs.readFile(configPath, "utf-8");
            configs[schema.id] = JSON.parse(content);
        } catch {
            configs[schema.id] = null;
        }
    }

    res.json({ data: { available, configs } });
});

router.post("/:id", async (req: any, res) => {
    const { id } = req.params;
    const config = req.body;

    const IntegrationClass = IntegrationManager.AVAILABLE_INTEGRATIONS.find(I => {
        const temp = new (I as any)({} as any, {});
        return temp.id === id;
    });

    if (!IntegrationClass) {
        return res.status(404).send("Integration not found");
    }

    // Validate (optional, could instantiation and call validate)
    const configPath = getUserIntegrationConfigFile(req.user.id, id);
    await fs.writeFile(configPath, JSON.stringify(config, null, 4), "utf-8");

    // Reload integration for user
    await IntegrationManager.reloadUser(req.user.id);

    res.send("Integration updated and restarted");
});

router.delete("/:id", async (req: any, res) => {
    const { id } = req.params;
    const configPath = getUserIntegrationConfigFile(req.user.id, id);
    try {
        await fs.unlink(configPath);
        await IntegrationManager.reloadUser(req.user.id);
        res.send("Integration disabled");
    } catch {
        res.status(404).send("Integration not enabled");
    }
});

export default router;
