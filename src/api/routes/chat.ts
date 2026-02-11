import express from "express";

import { Storage } from "@/data/storage";
import { authenticate, adminOnly } from "../middleware/auth.middleware";

const router = express.Router();

router.get("/user/chat", authenticate, async (req: any, res) => {
    const chats = await Storage.listChats(req.user.id);
    res.json(chats);
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
