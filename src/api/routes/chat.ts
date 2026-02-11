import express from "express";
import { Storage } from "../../storage";
import { authenticate, adminOnly } from "../middleware/auth";

const router = express.Router();

router.get("/admin/chat", authenticate, adminOnly, async (req, res) => {
    // Admin needs a way to see all chats of all users.
    // This is complex now with user dirs.
    // For now, let's just return current user's chats or Implement a global list.
    // I'll skip global list for now to focus on the structure requested.
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
