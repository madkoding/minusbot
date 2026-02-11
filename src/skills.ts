import path from "node:path";
import fs from "node:fs/promises";

import { SHARED_SKILLS_DIR, getUserDir, getUserSettings, getUserIntegrationConfigFile } from "./config";
import { SandboxManager } from "./sandbox/index";
import { WorkspaceManager } from "./workspaces";
import { secrets } from "./secrets";

export interface Skill {
    id: string; // The folder name
    definition: any; // The content of skill.json
    enabled: boolean;
    isGlobal: boolean;
}

export class SkillManager {
    static getUserSkillsDir(userId: string) {
        return path.join(getUserDir(userId), "skills");
    }

    private static async listFromDir(dir: string, isGlobal: boolean): Promise<Skill[]> {
        try {
            const folders = await fs.readdir(dir);
            const skills: Skill[] = [];
            for (const folder of folders) {
                const skillPath = path.join(dir, folder);
                const stat = await fs.stat(skillPath).catch(() => null);
                if (stat?.isDirectory()) {
                    const jsonPath = path.join(skillPath, "skill.json");
                    try {
                        const definition = JSON.parse(await fs.readFile(jsonPath, "utf-8"));
                        const enabled = definition.enabled !== false;
                        skills.push({ id: folder, definition, enabled, isGlobal });
                    } catch { }
                }
            }
            return skills;
        } catch {
            return [];
        }
    }

    static async listSkills(userId?: string): Promise<Skill[]> {
        const globalSkills = await this.listFromDir(SHARED_SKILLS_DIR, true);

        // If no user, just list active global skills
        if (!userId) return globalSkills.filter(s => s.enabled);

        const userSkills = await this.listFromDir(this.getUserSkillsDir(userId), false);
        const settings = await getUserSettings(userId);
        const disabledByMe = settings.disabled_skills || [];

        // Merge them, user skills with same ID override global skills
        const merged = new Map<string, Skill>();

        // Only include global skills if they are enabled globally
        globalSkills.forEach(s => {
            if (s.enabled) {
                // If user disabled it personally, mark as disabled
                if (disabledByMe.includes(s.id)) s.enabled = false;
                merged.set(s.id, s);
            }
        });

        userSkills.forEach(s => {
            // User skills are always included but can be disabled
            if (disabledByMe.includes(s.id)) s.enabled = false;
            merged.set(s.id, s);
        });

        return Array.from(merged.values());
    }

    static async getSkill(userId: string, id: string): Promise<Skill | null> {
        // Check user skills first
        const userPath = path.join(this.getUserSkillsDir(userId), id);
        try {
            const definition = JSON.parse(await fs.readFile(path.join(userPath, "skill.json"), "utf-8"));
            return { id, definition, enabled: definition.enabled !== false, isGlobal: false };
        } catch {
            // Check global skills
            const globalPath = path.join(SHARED_SKILLS_DIR, id);
            try {
                const definition = JSON.parse(await fs.readFile(path.join(globalPath, "skill.json"), "utf-8"));
                return { id, definition, enabled: definition.enabled !== false, isGlobal: true };
            } catch {
                return null;
            }
        }
    }

    static async runSkill(userId: string, id: string, inputs: any, workspaceId: string | null | undefined, chatId?: string): Promise<string> {
        const skill = await this.getSkill(userId, id);
        if (!skill || !skill.enabled) {
            throw new Error(`Skill ${id} is disabled or does not exist.`);
        }

        const skillPath = skill.isGlobal
            ? path.join(SHARED_SKILLS_DIR, id)
            : path.join(this.getUserSkillsDir(userId), id);

        const workspaceDir = WorkspaceManager.resolveContentPath(userId, workspaceId, chatId);
        await fs.mkdir(workspaceDir, { recursive: true });

        // Load Vault
        const vaultId = `skill-${id}`;
        const vault = await secrets.userVault(userId, vaultId);
        const envSecrets = vault.allValues();

        // Load Config
        // We reuse the integration config file location since the prompt asked for "IGUAL que el de las integraciones"
        // and we can just treat it as an integration ID "skill-<id>"
        const configPath = getUserIntegrationConfigFile(userId, vaultId);
        let configEnv: Record<string, string> = {};
        try {
            const configContent = await fs.readFile(configPath, "utf-8");
            const config = JSON.parse(configContent);
            for (const [key, value] of Object.entries(config)) {
                configEnv[`CONFIG_${key}`] = String(value);
            }
        } catch {
            // No config or failed to load
        }

        const env = { ...envSecrets, ...configEnv };

        // Use SandboxManager
        return await SandboxManager.runContainer(
            "python:3.11-slim",
            skillPath,
            workspaceDir,
            ["python", "/app/script.py", JSON.stringify(inputs)],
            env
        );
    }
}
