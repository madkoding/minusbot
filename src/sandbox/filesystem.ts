import fs from "node:fs/promises";
import path from "node:path";

import { WorkspaceManager } from "../data/workspaces";

export class FileSystem {
    static async resolvePath(userId: string, workspaceId: string | null | undefined, userPath: string, chatId?: string): Promise<string> {
        const workspaceDir = WorkspaceManager.resolveContentPath(userId, workspaceId, chatId);
        await fs.mkdir(workspaceDir, { recursive: true });

        // Treat all paths as relative to workspace
        let safePath = userPath;
        if (safePath.startsWith("/")) {
            safePath = safePath.substring(1);
        }

        // Resolve absolute path
        const resolvedPath = path.resolve(workspaceDir, safePath);

        // Security check: ensure resolved path is inside workspace
        if (!resolvedPath.startsWith(workspaceDir)) {
            throw new Error("Access denied: Path is outside of the workspace.");
        }

        return resolvedPath;
    }

    static async mkdir(userId: string, workspaceId: string | null | undefined, dirPath: string, chatId?: string): Promise<string> {
        const target = await this.resolvePath(userId, workspaceId, dirPath, chatId);
        await fs.mkdir(target, { recursive: true });
        return `Directory '${dirPath}' created.`;
    }

    static async rm(userId: string, workspaceId: string | null | undefined, targetPath: string, chatId?: string): Promise<string> {
        const target = await this.resolvePath(userId, workspaceId, targetPath, chatId);
        await fs.rm(target, { recursive: true, force: true });
        return `Deleted '${targetPath}'.`;
    }

    static async read(userId: string, workspaceId: string | null | undefined, filePath: string, chatId?: string): Promise<string> {
        const target = await this.resolvePath(userId, workspaceId, filePath, chatId);
        const stat = await fs.stat(target);
        if (stat.isDirectory()) {
            throw new Error(`'${filePath}' is a directory.`);
        }
        return await fs.readFile(target, "utf-8");
    }

    static async write(userId: string, workspaceId: string | null | undefined, filePath: string, content: string, chatId?: string): Promise<string> {
        const target = await this.resolvePath(userId, workspaceId, filePath, chatId);

        // Ensure parent directory exists
        const parentDir = path.dirname(target);
        await fs.mkdir(parentDir, { recursive: true });

        await fs.writeFile(target, content, "utf-8");
        return `Written to '${filePath}'.`;
    }

    static async stat(userId: string, workspaceId: string | null | undefined, targetPath: string, chatId?: string): Promise<string> {
        const target = await this.resolvePath(userId, workspaceId, targetPath, chatId);
        try {
            const stat = await fs.stat(target);
            return JSON.stringify({
                path: targetPath,
                size: stat.size,
                created: stat.birthtime,
                modified: stat.mtime,
                isDirectory: stat.isDirectory(),
                isFile: stat.isFile()
            }, null, 2);
        } catch (e: any) {
            if (e.code === 'ENOENT') {
                return `File or directory '${targetPath}' does not exist.`;
            }
            throw e;
        }
    }

    static async ls(userId: string, workspaceId: string | null | undefined, dirPath: string = ".", chatId?: string): Promise<string> {
        const target = await this.resolvePath(userId, workspaceId, dirPath, chatId);
        const stat = await fs.stat(target);

        if (!stat.isDirectory()) {
            return JSON.stringify({
                path: dirPath,
                size: stat.size,
                created: stat.birthtime,
                modified: stat.mtime,
                isDirectory: false,
                isFile: true
            }, null, 2);
        }

        const files = await fs.readdir(target, { withFileTypes: true });
        if (files.length === 0) return "Directory is empty.";

        return files.map(f => {
            const type = f.isDirectory() ? "DIR" : "FILE";
            return `[${type}] ${f.name}`;
        }).join("\n");
    }
}
