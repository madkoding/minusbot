import { Router } from "express";
import { ChannelManager, type ChannelConfig, type ChannelSchema, type ChannelField } from "@/channels";

const router = Router();

// GET /api/user/channels - List all available channels with user config status
router.get("/", async (req, res) => {
    try {
        const userId = (req as any).user.id;
        const availableChannels = ChannelManager.getAvailableChannels();

        const channelsWithStatus = await Promise.all(
            availableChannels.map(async (channel: ChannelSchema) => {
                const config = await ChannelManager.getChannelConfig(userId, channel.id);
                return {
                    ...channel,
                    enabled: config?.enabled ?? false,
                    configured: config !== null
                };
            })
        );

        res.json({ data: channelsWithStatus });
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

// GET /api/user/channels/:channelId - Get user config for a specific channel
router.get("/:channelId", async (req, res) => {
    try {
        const userId = (req as any).user.id;
        const { channelId } = req.params;

        const availableChannels = ChannelManager.getAvailableChannels();
        const channelSchema = availableChannels.find((c: ChannelSchema) => c.id === channelId);

        if (!channelSchema) {
            return res.status(404).json({ error: "Channel not found" });
        }

        const config = await ChannelManager.getChannelConfig(userId, channelId);

        if (!config) {
            // Return default config
            return res.json({
                data: {
                    enabled: false,
                    settings: {},
                    secrets: {},
                    schema: channelSchema
                }
            });
        }

        // Don't send actual secret values to frontend, just indicate if they're set
        const secretsStatus: Record<string, boolean> = {};
        const secretFields = channelSchema.fields.filter((f: ChannelField) => f.secret);
        for (const field of secretFields) {
            secretsStatus[field.id] = !!config.secrets[field.id];
        }

        res.json({
            data: {
                enabled: config.enabled,
                settings: config.settings,
                secretsStatus,
                schema: channelSchema
            }
        });
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

// PUT /api/user/channels/:channelId - Update user config for a specific channel
router.put("/:channelId", async (req, res) => {
    try {
        const userId = (req as any).user.id;
        const { channelId } = req.params;
        const { enabled, settings, secrets: secretsData } = req.body;

        const availableChannels = ChannelManager.getAvailableChannels();
        const channelSchema = availableChannels.find((c: ChannelSchema) => c.id === channelId);

        if (!channelSchema) {
            return res.status(404).json({ error: "Channel not found" });
        }

        // Get existing config or create new one
        let config = await ChannelManager.getChannelConfig(userId, channelId);
        if (!config) {
            config = {
                enabled: false,
                settings: {},
                secrets: {}
            };
        }

        // Update config
        if (enabled !== undefined) {
            config.enabled = enabled;
        }

        if (settings) {
            config.settings = { ...config.settings, ...settings };
        }

        if (secretsData) {
            // Only update secrets that are marked as secret in schema
            const secretFields = channelSchema.fields.filter((f: ChannelField) => f.secret);
            for (const field of secretFields) {
                if (secretsData[field.id] !== undefined && secretsData[field.id] !== "") {
                    config.secrets[field.id] = secretsData[field.id];
                }
            }
        }

        // Save config
        await ChannelManager.saveChannelConfig(userId, channelId, config);

        // Reload channels for this user
        await ChannelManager.reloadUser(userId);

        res.json({ data: { success: true } });
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

// DELETE /api/user/channels/:channelId - Delete user config for a specific channel
router.delete("/:channelId", async (req, res) => {
    try {
        const userId = (req as any).user.id;
        const { channelId } = req.params;

        const config: ChannelConfig = {
            enabled: false,
            settings: {},
            secrets: {}
        };

        await ChannelManager.saveChannelConfig(userId, channelId, config);
        await ChannelManager.reloadUser(userId);

        res.json({ data: { success: true } });
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

export default router;
