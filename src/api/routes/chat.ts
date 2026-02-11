import express from "express";

import { Storage } from "../../storage";
import { authenticate, adminOnly } from "../middleware/auth";

const router = express.Router();

router.get("/admin/chat", authenticate, adminOnly, async (req, res) => {
    // To-do: Add admin chat endpoint.
    res.json([]);
});

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
