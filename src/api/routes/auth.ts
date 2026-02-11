import express from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { UserManager } from "../../users";
import { authenticate } from "../middleware/auth";

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "minusbot-super-secret-123";

router.post("/login", async (req, res) => {
    const { username, password } = req.body;
    const user = UserManager.getUserByUsername(username);

    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
        return res.status(401).send("Invalid credentials");
    }

    const sessionId = Math.random().toString(36).substring(2);
    const expiresAt = Date.now() + 1000 * 60 * 60 * 24; // 24h

    await UserManager.saveSession({ id: sessionId, userId: user.id, expiresAt });

    const token = jwt.sign({ userId: user.id, sessionId }, JWT_SECRET, { expiresIn: "24h" });
    res.json({ token, user: { id: user.id, username: user.username, role: user.role } });
});

router.delete("/session/:id", authenticate, async (req: any, res) => {
    if (req.params.id === req.sessionId || req.user.role !== "user") {
        await UserManager.deleteSession(req.params.id);
        res.send("Session deleted");
    } else {
        res.status(403).send("Forbidden");
    }
});

export default router;
