import express from "express";
import multer from "multer";
import path from "node:path";
import fs from "node:fs/promises";
import { createReadStream } from "node:fs";
import { Storage } from "@/data/storage";

const router = express.Router({ mergeParams: true });
const upload = multer();

// Middleware inside the route handler
const verifyChatAccess = async (req: any, res: any, next: any) => {
    const { chatId } = req.params;
    if (!chatId) return next(); // Should be handled by route definition

    const chat = await Storage.getChat(req.user.id, chatId);
    if (!chat) return res.status(404).json({ error: "Chat not found" });

    req.chat = chat;
    next();
};

// Mount middleware for all routes using :chatId
router.use("/:chatId/files", verifyChatAccess);

// List files
router.get("/:chatId/files", async (req: any, res) => {
    const contentDir = Storage.getChatContentPath(req.user.id, req.params.chatId);
    try {
        await fs.mkdir(contentDir, { recursive: true });
        const files = await fs.readdir(contentDir, { withFileTypes: true });

        const result = [];
        for (const file of files) {
            const name = file.name;
            // Skip hidden files
            if (name.startsWith('.')) continue;

            const stats = await fs.stat(path.join(contentDir, name));
            result.push({
                name,
                size: stats.size,
                mtime: stats.mtime,
                isDirectory: stats.isDirectory()
            });
        }
        res.json(result);
    } catch (e) {
        res.json([]);
    }
});

// Upload files
router.post("/:chatId/files", upload.array("files"), async (req: any, res) => {
    if (!req.files || req.files.length === 0) {
        return res.status(400).json({ error: "No files provided" });
    }

    const contentDir = Storage.getChatContentPath(req.user.id, req.params.chatId);
    await fs.mkdir(contentDir, { recursive: true });

    const files = req.files as Express.Multer.File[];
    const savedFiles = [];

    for (const file of files) {
        // Sanitize filename
        const safeName = path.basename(file.originalname).replace(/[^a-zA-Z0-9.-]/g, "_");
        const filePath = path.join(contentDir, safeName);

        await fs.writeFile(filePath, file.buffer);
        savedFiles.push(safeName);

        // Update chat meta for recent uploads
        if (!req.chat.meta.recentlyFileUploaded) {
            req.chat.meta.recentlyFileUploaded = [];
        }
        if (!req.chat.meta.recentlyFileUploaded.includes(safeName)) {
            req.chat.meta.recentlyFileUploaded.push(safeName);
        }
    }

    await Storage.saveChat(req.chat);
    res.json({ message: "Files uploaded", files: savedFiles });
});

// Download file
router.get("/:chatId/files/:filename", verifyChatAccess, async (req: any, res) => {
    const contentDir = Storage.getChatContentPath(req.user.id, req.params.chatId);
    const filename = path.basename(req.params.filename);
    const filePath = path.join(contentDir, filename);

    // Check if file exists to prevent errors crashing the server in download callback
    try {
        await fs.access(filePath);

        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        const fileStream = createReadStream(filePath);

        fileStream.on('error', (err) => {
            console.error(`Stream error for ${filePath}:`, err);
            if (!res.headersSent) res.status(404).send("File not found or unreadable");
        });

        fileStream.pipe(res);
    } catch {
        res.status(404).send("File not found");
    }
});

// Delete file
router.delete("/:chatId/files/:filename", verifyChatAccess, async (req: any, res) => {
    const contentDir = Storage.getChatContentPath(req.user.id, req.params.chatId);
    const filename = path.basename(req.params.filename);
    const filePath = path.join(contentDir, filename);

    try {
        await fs.unlink(filePath);

        // Remove from recent uploads if present
        if (req.chat.meta.recentlyFileUploaded) {
            req.chat.meta.recentlyFileUploaded = req.chat.meta.recentlyFileUploaded.filter((f: string) => f !== filename);
            await Storage.saveChat(req.chat);
        }

        res.send("File deleted");
    } catch {
        res.status(404).send("File not found");
    }
});

// Rename file
router.put("/:chatId/files/:filename", verifyChatAccess, async (req: any, res) => {
    const contentDir = Storage.getChatContentPath(req.user.id, req.params.chatId);
    const oldName = path.basename(req.params.filename);
    const newName = path.basename(req.body.newName).replace(/[^a-zA-Z0-9.-]/g, "_");

    if (!newName) return res.status(400).send("Invalid new filename");

    try {
        await fs.rename(path.join(contentDir, oldName), path.join(contentDir, newName));

        // Update meta
        if (req.chat.meta.recentlyFileUploaded) {
            const idx = req.chat.meta.recentlyFileUploaded.indexOf(oldName);
            if (idx !== -1) {
                req.chat.meta.recentlyFileUploaded[idx] = newName;
                await Storage.saveChat(req.chat);
            }
        }

        res.send("File renamed");
    } catch {
        res.status(404).send("File not found");
    }
});

export default router;
