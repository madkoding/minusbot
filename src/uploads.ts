import path from "node:path";
import fs from "node:fs/promises";

import { Storage, type Chat } from "./storage";

export async function uploadFileToChat(chat: Chat, input: string | Buffer, filename: string) {
    const userId = chat.meta.owner;
    const contentDir = Storage.getChatContentPath(userId, chat.meta.id);
    await fs.mkdir(contentDir, { recursive: true });

    const filePath = path.join(contentDir, filename);

    if (Buffer.isBuffer(input)) {
        await fs.writeFile(filePath, input);
    } else {
        const response = await fetch(input);
        if (!response.ok) {
            throw new Error(`Failed to download file from URL: ${response.statusText}`);
        }
        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        await fs.writeFile(filePath, buffer);
    }

    if (!chat.meta.recentlyFileUploaded) {
        chat.meta.recentlyFileUploaded = [];
    }
    chat.meta.recentlyFileUploaded.push(filename);
}
