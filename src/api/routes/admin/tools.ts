import express from "express";
import { toolManager } from "../../../tools/tools";

const router = express.Router();

router.get("/", async (req, res) => {
    res.json(toolManager.getAllDefinitions());
});

export default router;
