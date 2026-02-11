import { Router } from "express";

import { ChannelManager, type ChannelSchema } from "@/channels";
import { secrets } from "@/secrets";

const router = Router();

// GET /api/admin/channels - List all available channels
router.get("/", async (req, res) => {
    try {
        const channels = ChannelManager.getAvailableChannels();
        res.json({ data: channels });
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

// GET /api/admin/channels/:channelId/vault - Get admin vault keys for a channel
router.get("/:channelId/vault", async (req, res) => {
    try {
        const { channelId } = req.params;
        const channels = ChannelManager.getAvailableChannels();
        const channel = channels.find((c: ChannelSchema) => c.id === channelId);

        if (!channel) {
            return res.status(404).json({ error: "Channel not found" });
        }

        const vaultId = `channel-${channelId}-admin`;
        const vault = await secrets.globalVault(vaultId);

        const vaultData: Record<string, string> = {};
        if (channel.vaultKeys) {
            for (const key of channel.vaultKeys) {
                vaultData[key] = vault.get(key) || "";
            }
        }

        res.json({ data: vaultData });
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

// PUT /api/admin/channels/:channelId/vault - Update admin vault keys for a channel
router.put("/:channelId/vault", async (req, res) => {
    try {
        const { channelId } = req.params;
        const { secrets: secretsData } = req.body;

        const channels = ChannelManager.getAvailableChannels();
        const channel = channels.find((c: ChannelSchema) => c.id === channelId);

        if (!channel) {
            return res.status(404).json({ error: "Channel not found" });
        }

        const vaultId = `channel-${channelId}-admin`;
        const vault = await secrets.globalVault(vaultId);

        // Only update keys that are defined in the channel schema
        if (channel.vaultKeys && secretsData) {
            for (const key of channel.vaultKeys) {
                if (secretsData[key] !== undefined) {
                    await vault.set(key, secretsData[key]);
                }
            }
        }

        res.json({ data: { success: true } });
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

export default router;
