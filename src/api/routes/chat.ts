import express from "express";

import { Storage } from "@/data/storage";
import { authenticate, adminOnly } from "../middleware/auth.middleware";

const router = express.Router();

router.get("/user/chat", authenticate, async (req: any, res) => {
    const chats = await Storage.listChats(req.user.id);
    res.json(chats);
});

router.get("/user/chat/:id", authenticate, async (req: any, res) => {
    const chat = await Storage.getChat(req.user.id, req.params.id);
    if (!chat) {
        return res.status(404).send("Chat not found");
    }
    res.json(chat);
});

router.delete("/admin/chat/:userId/:id", authenticate, adminOnly, async (req, res) => {
    await Storage.deleteChat(req.params.userId, req.params.id);
    res.send("Chat deleted");
});

router.get("/admin/chat/:userId/:id", authenticate, adminOnly, async (req, res) => {
    const chat = await Storage.getChat(req.params.userId, req.params.id);
    res.json(chat);
});

export default router;
