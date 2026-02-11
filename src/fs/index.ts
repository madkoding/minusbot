import fs from "node:fs/promises";
import path from "node:path";
import { Storage } from "../storage";

export class FileSystem {
    private static async getWorkspace(userId: string, chatId: string): Promise<string> {
        const workspace = Storage.getWorkspaceDir(userId, chatId);
        await fs.mkdir(workspace, { recursive: true });
        return workspace;
    }

    private static async resolvePath(userId: string, chatId: string, userPath: string): Promise<string> {
        const workspace = await this.getWorkspace(userId, chatId);

        // Treat all paths as relative to workspace
        let safePath = userPath;
        if (safePath.startsWith("/")) {
            safePath = safePath.substring(1);
        }

        // Resolve absolute path
        const resolvedPath = path.resolve(workspace, safePath);

        // Security check: ensure resolved path is inside workspace
        if (!resolvedPath.startsWith(workspace)) {
            throw new Error("Access denied: Path is outside of the workspace.");
        }

        return resolvedPath;
    }

    static async mkdir(userId: string, chatId: string, dirPath: string): Promise<string> {
        const target = await this.resolvePath(userId, chatId, dirPath);
        await fs.mkdir(target, { recursive: true });
        return `Directory '${dirPath}' created.`;
    }

    static async rm(userId: string, chatId: string, targetPath: string): Promise<string> {
        const target = await this.resolvePath(userId, chatId, targetPath);
        await fs.rm(target, { recursive: true, force: true });
        return `Deleted '${targetPath}'.`;
    }

    static async read(userId: string, chatId: string, filePath: string): Promise<string> {
        const target = await this.resolvePath(userId, chatId, filePath);
        const stat = await fs.stat(target);
        if (stat.isDirectory()) {
            throw new Error(`'${filePath}' is a directory.`);
        }
        return await fs.readFile(target, "utf-8");
    }

    static async write(userId: string, chatId: string, filePath: string, content: string): Promise<string> {
        const target = await this.resolvePath(userId, chatId, filePath);

        // Ensure parent directory exists
        const parentDir = path.dirname(target);
        await fs.mkdir(parentDir, { recursive: true });

        await fs.writeFile(target, content, "utf-8");
        return `Written to '${filePath}'.`;
    }

    static async stat(userId: string, chatId: string, targetPath: string): Promise<string> {
        const target = await this.resolvePath(userId, chatId, targetPath);
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

    static async ls(userId: string, chatId: string, dirPath: string = "."): Promise<string> {
        const target = await this.resolvePath(userId, chatId, dirPath);
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
