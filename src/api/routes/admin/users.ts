import express from "express";
import bcrypt from "bcrypt";

import { UserManager } from "@/users";

const router = express.Router();

router.get("/", async (req, res) => {
    res.json(UserManager.getUsers());
});

router.post("/", async (req, res) => {
    const { username, password, role } = req.body;
    try {
        const user = await UserManager.createUser(username, password, role);
        res.json(user);
    } catch (e: any) {
        res.status(400).send(e.message);
    }
});

router.put("/", async (req, res) => {
    const { id, username, password, role } = req.body;
    try {
        const updates: any = { username, role };
        if (password) updates.passwordHash = await bcrypt.hash(password, 10);
        const user = await UserManager.updateUser(id, updates);
        res.json(user);
    } catch (e: any) {
        res.status(400).send(e.message);
    }
});

router.delete("/:id", async (req, res) => {
    try {
        await UserManager.deleteUser(req.params.id);
        res.send("User deleted");
    } catch (e: any) {
        res.status(400).send(e.message);
    }
});

export default router;
