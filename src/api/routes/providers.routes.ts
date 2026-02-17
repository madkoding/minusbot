import express from "express";
import { ProviderManager } from "@/data/providers";
import { AIRegistry } from "@/ai/registry";
import { v4 as uuid } from "uuid";
import { getGlobalSettings, getUserSettings, getUserSettingsFile, GLOBAL_SETTINGS_FILE } from "@/data/storage";
import fs from "node:fs/promises";
import path from "node:path";

const router = express.Router();

// List available clients
router.get("/clients", (req, res) => {
    res.json(AIRegistry.getAllClients());
});

// List models for a client with on-flight config
router.post("/list-models", async (req: any, res) => {
    const { client: clientId, type, apiKey, extra } = req.body;
    const client = AIRegistry.getClient(clientId);
    if (!client) return res.status(404).send("Client not found");

    try {
        const models = await client.getModels(apiKey, type, extra);
        res.json(models);
    } catch (error: any) {
        res.status(500).send(error.message);
    }
});

// List models for an existing provider
router.get("/:id/list-models", async (req: any, res) => {
    const provider = await ProviderManager.getProvider(req.params.id, req.user.id);
    if (!provider) return res.status(404).send("Provider not found");

    const client = AIRegistry.getClient(provider.client);
    if (!client) return res.status(404).send("Client not found");

    try {
        const token = await ProviderManager.getProviderToken(provider.id, provider.is_global ? undefined : req.user.id);
        if (!token) return res.status(401).send("Token not found");

        const models = await client.getModels(token, provider.type, provider.config.extra);
        res.json(models);
    } catch (error: any) {
        res.status(500).send(error.message);
    }
});

// List providers
router.get("/", async (req: any, res) => {
    res.json(await ProviderManager.listProviders(req.user.id));
});

// Create/Update provider
router.post("/", async (req: any, res) => {
    const { id, name, type, client, config, token, is_global } = req.body;

    if (is_global && req.user.role !== "root") {
        return res.status(403).send("Only root can create global providers");
    }

    const isEdit = !!id;
    if (isEdit) {
        const existing = await ProviderManager.getProvider(id, req.user.id);
        if (!existing) return res.status(404).send("Provider not found");

        // "Editar el provider solo permitirá cambiar de model id, el token y el nombre, pero no el tipo ni opciones configurables del provider."
        if (existing.type !== type || existing.client !== client) {
            return res.status(400).send("Cannot change provider type or client protocol");
        }

        // Merge config for extra options (only allow changing model_id, max_tokens, temperature)
        config.extra = existing.config.extra;
    }

    const providerId = id || uuid();
    const provider = {
        id: providerId,
        name,
        type,
        client,
        config,
        is_global: !!is_global,
        owner: is_global ? undefined : req.user.id
    };

    await ProviderManager.saveProvider(provider, is_global ? undefined : req.user.id);
    if (token) {
        await ProviderManager.setProviderToken(providerId, token, is_global ? undefined : req.user.id);
    }

    res.json(provider);
});

// Delete provider
router.delete("/:id", async (req: any, res) => {
    const provider = await ProviderManager.getProvider(req.params.id, req.user.id);
    if (!provider) return res.status(404).send("Provider not found");

    if (provider.is_global && req.user.role !== "root") {
        return res.status(403).send("Only root can delete global providers");
    }

    await ProviderManager.deleteProvider(req.params.id, provider.is_global ? undefined : req.user.id);
    res.send("Provider deleted");
});

// Set active provider
router.post("/activate", async (req: any, res) => {
    const { id, type, is_global_setting } = req.body;

    if (is_global_setting && req.user.role !== "root") {
        return res.status(403).send("Only root can change global active providers");
    }

    // Load existing settings without merging
    let settings: any;
    const file = is_global_setting ? GLOBAL_SETTINGS_FILE : getUserSettingsFile(req.user.id);

    try {
        const content = await fs.readFile(file, "utf-8");
        settings = JSON.parse(content);
    } catch {
        settings = {};
    }

    if (!settings.active_providers) settings.active_providers = {};

    if (id === null) {
        delete settings.active_providers[type as string];
    } else {
        settings.active_providers[type as string] = id;
    }

    await fs.mkdir(path.dirname(file), { recursive: true });
    await fs.writeFile(file, JSON.stringify(settings, null, 4), "utf-8");

    res.json(settings);
});

export default router;
