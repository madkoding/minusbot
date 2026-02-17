import express from "express";
import { commandManager } from "@/commands";
import { authenticate } from "../middleware/auth.middleware";

const router = express.Router();

router.get("/user/commands", authenticate, async (req: any, res) => {
    const commands = commandManager.getCommands();

    // Filter commands based on user role
    const userRole = req.user.role;
    const filteredCommands = commands.filter(cmd => {
        if (!cmd.needRole) return true;

        // Role hierarchy: admin > user
        if (userRole === "admin") return true;
        if (userRole === "user" && cmd.needRole === "user") return true;

        return false;
    });

    // Format commands for frontend
    const formattedCommands = filteredCommands.map(cmd => ({
        name: cmd.name,
        description: cmd.description,
        usage: cmd.usage,
        args: cmd.args || [],
        subs: cmd.subs?.map(sub => ({
            name: sub.name,
            description: sub.description,
            args: sub.args || []
        })) || []
    }));

    res.json(formattedCommands);
});

export default router;
