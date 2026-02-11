import fs from "node:fs/promises";
import path from "node:path";

import { getWorkspacesDir } from "./config";
import { Storage } from "./storage";

export interface Workspace {
    id: string;
    displayName: string;
    createdAt: string;
    meta: Record<string, any>;
}

export class WorkspaceManager {
    static getWorkspacePath(userId: string, workspaceId: string) {
        return path.join(getWorkspacesDir(userId), workspaceId);
    }

    static getWorkspaceContentPath(userId: string, workspaceId: string) {
        return path.join(this.getWorkspacePath(userId, workspaceId), "content");
    }

    static resolveContentPath(userId: string, workspaceId: string | null | undefined, chatId?: string) {
        if (!workspaceId || workspaceId === "chat") {
            if (!chatId) throw new Error("Chat ID is required to resolve chat workspace.");
            return Storage.getChatContentPath(userId, chatId);
        }
        return this.getWorkspaceContentPath(userId, workspaceId);
    }

    static getWorkspaceMetaPath(userId: string, workspaceId: string) {
        return path.join(this.getWorkspacePath(userId, workspaceId), "workspace.json");
    }

    static async init(userId: string) {
        const dir = getWorkspacesDir(userId);
        await fs.mkdir(dir, { recursive: true });
    }

    static async create(userId: string, displayName: string, meta: Record<string, any> = {}): Promise<Workspace> {
        const id = Math.random().toString(36).substring(7);
        const workspace: Workspace = {
            id,
            displayName,
            createdAt: new Date().toISOString(),
            meta
        };

        const contentPath = this.getWorkspaceContentPath(userId, id);
        const metaPath = this.getWorkspaceMetaPath(userId, id);

        await fs.mkdir(contentPath, { recursive: true });
        await fs.writeFile(metaPath, JSON.stringify(workspace, null, 4), "utf-8");

        return workspace;
    }

    static async list(userId: string): Promise<Workspace[]> {
        const dir = getWorkspacesDir(userId);
        try {
            const entries = await fs.readdir(dir, { withFileTypes: true });
            const workspaces: Workspace[] = [];

            for (const entry of entries) {
                if (entry.isDirectory()) {
                    const metaPath = this.getWorkspaceMetaPath(userId, entry.name);
                    try {
                        const content = await fs.readFile(metaPath, "utf-8");
                        workspaces.push(JSON.parse(content));
                    } catch { }
                }
            }

            return workspaces;
        } catch {
            return [];
        }
    }

    static async get(userId: string, workspaceId: string): Promise<Workspace | null> {
        const metaPath = this.getWorkspaceMetaPath(userId, workspaceId);
        try {
            const content = await fs.readFile(metaPath, "utf-8");
            return JSON.parse(content);
        } catch {
            return null;
        }
    }

    static async update(userId: string, workspaceId: string, updates: Partial<Workspace>): Promise<Workspace> {
        const workspace = await this.get(userId, workspaceId);
        if (!workspace) throw new Error("Workspace not found");

        const updated = { ...workspace, ...updates, id: workspace.id }; // ID cannot be updated
        const metaPath = this.getWorkspaceMetaPath(userId, workspaceId);
        await fs.writeFile(metaPath, JSON.stringify(updated, null, 4), "utf-8");
        return updated;
    }

    static async delete(userId: string, workspaceId: string) {
        const workspacePath = this.getWorkspacePath(userId, workspaceId);
        await fs.rm(workspacePath, { recursive: true, force: true });
    }
}
