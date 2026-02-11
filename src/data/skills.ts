import path from "node:path";
import fs from "node:fs/promises";
import os from "node:os";

import { SHARED_SKILLS_DIR, getUserDir, getUserSettings, getUserIntegrationConfigFile } from "./storage";
import { SandboxManager } from "../sandbox/container";
import { WorkspaceManager } from "./workspaces";
import { secrets } from "../secrets";
import { Logger } from "../cli/colors";

export interface SkillAction {
    name: string;
    description: string;
    parameters: any;
    _script: string;
    _bins?: Record<string, Record<string, string>>;
}

export interface SkillDefinition {
    id: string;
    displayName: string;
    description: string;
    vaultKeys?: string[];
    configSchema?: any;
    actions: SkillAction[];
    enabled?: boolean;
}

export interface Skill {
    id: string; // The folder name
    definition: SkillDefinition;
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
                        const definition = JSON.parse(await fs.readFile(jsonPath, "utf-8")) as SkillDefinition;
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
        if (!userId) return globalSkills.filter(s => s.enabled);

        const userSkills = await this.listFromDir(this.getUserSkillsDir(userId), false);
        const settings = await getUserSettings(userId);
        const disabledByMe = settings.disabled_skills || [];

        const merged = new Map<string, Skill>();

        globalSkills.forEach(s => {
            if (s.enabled) {
                const skill = { ...s };
                if (disabledByMe.includes(s.id)) skill.enabled = false;
                merged.set(s.id, skill);
            }
        });

        userSkills.forEach(s => {
            const skill = { ...s };
            if (disabledByMe.includes(s.id)) skill.enabled = false;
            merged.set(s.id, skill);
        });

        return Array.from(merged.values());
    }

    static async getSkill(userId: string, id: string): Promise<Skill | null> {
        const userPath = path.join(this.getUserSkillsDir(userId), id);
        try {
            const definition = JSON.parse(await fs.readFile(path.join(userPath, "skill.json"), "utf-8"));
            return { id, definition, enabled: definition.enabled !== false, isGlobal: false };
        } catch {
            const globalPath = path.join(SHARED_SKILLS_DIR, id);
            try {
                const definition = JSON.parse(await fs.readFile(path.join(globalPath, "skill.json"), "utf-8"));
                return { id, definition, enabled: definition.enabled !== false, isGlobal: true };
            } catch {
                return null;
            }
        }
    }

    private static async ensureBinaries(skillPath: string, action: SkillAction) {
        if (!action._bins) return;

        const binDir = path.join(skillPath, "bin");
        await fs.mkdir(binDir, { recursive: true });

        const arch = `${os.platform()}-${os.arch()}`;

        for (const [binName, archs] of Object.entries(action._bins)) {
            const binPath = path.join(binDir, binName);
            const exists = await fs.stat(binPath).catch(() => null);

            if (!exists) {
                const url = archs[arch] || archs["all"] || archs["default"];
                if (url) {
                    await Logger.info(`Downloading binary ${binName} for ${arch}...`);
                    try {
                        const response = await fetch(url);
                        if (!response.ok) throw new Error(`HTTP ${response.status}`);
                        const arrayBuffer = await response.arrayBuffer();
                        const buffer = Buffer.from(arrayBuffer);

                        if (url.endsWith(".zip")) {
                            const zipPath = `${binPath}.zip`;
                            await fs.writeFile(zipPath, buffer);

                            const { execSync } = await import("node:child_process");
                            try {
                                execSync(`unzip -o "${zipPath}" -d "${binDir}"`);
                                // If the zip contains a binary with a different name, we might need a rename logic.
                                // ffbinaries usually names them 'ffmpeg' inside the zip.
                                if (binName !== "ffmpeg" && binName !== "ffprobe") {
                                    // Fallback rename if needed, but for ffmpeg it's usually fine.
                                }
                            } catch (unzipErr: any) {
                                await Logger.error(`Unzip failed: ${unzipErr.message}. Make sure 'unzip' is installed.`);
                            } finally {
                                await fs.unlink(zipPath).catch(() => { });
                            }
                        } else {
                            await fs.writeFile(binPath, buffer);
                        }

                        await fs.chmod(binPath, 0o755);
                    } catch (e: any) {
                        await Logger.error(`Failed to download binary ${binName}: ${e.message}`);
                    }
                }
            }
        }
    }

    static async runSkill(
        userId: string,
        id: string,
        actionName: string,
        inputs: any,
        workspaceId: string | null | undefined,
        chatId?: string
    ): Promise<string> {
        const skill = await this.getSkill(userId, id);
        if (!skill || !skill.enabled) {
            throw new Error(`Skill ${id} is disabled or does not exist.`);
        }

        const action = skill.definition.actions.find(a => a.name === actionName);
        if (!action) {
            throw new Error(`Action ${actionName} not found in skill ${id}.`);
        }

        const skillPath = skill.isGlobal
            ? path.join(SHARED_SKILLS_DIR, id)
            : path.join(this.getUserSkillsDir(userId), id);

        // Ensure binaries
        await this.ensureBinaries(skillPath, action);

        const workspaceDir = WorkspaceManager.resolveContentPath(userId, workspaceId, chatId);
        await fs.mkdir(workspaceDir, { recursive: true });

        // Load Vault
        const vaultId = `skill_${id}`; // Matching user preference skill_(id)
        const vault = await secrets.vault(userId, vaultId);
        const envSecrets = vault.allValues();

        // Load Config
        const configPath = getUserIntegrationConfigFile(userId, vaultId);
        let configEnv: Record<string, string> = {};
        try {
            const configContent = await fs.readFile(configPath, "utf-8");
            const config = JSON.parse(configContent);
            for (const [key, value] of Object.entries(config)) {
                configEnv[`CONFIG_${key}`] = String(value);
            }
        } catch { }

        const env = {
            ...envSecrets,
            ...configEnv,
            PATH: `/skill/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin`
        };

        // Use SandboxManager
        return await SandboxManager.runContainer(
            "python:3.11-slim",
            skillPath,
            workspaceDir,
            ["python", `/skill/scripts/${action._script}`, JSON.stringify(inputs)],
            env
        );
    }

    static async getToolsForUser(userId: string): Promise<any[]> {
        const skills = await this.listSkills(userId);
        const tools: any[] = [];

        for (const skill of skills) {
            if (!skill.enabled) continue;

            for (const action of skill.definition.actions) {
                const toolName = `skill_${skill.id}_${action.name}`;
                tools.push({
                    definition: {
                        type: "function",
                        function: {
                            name: toolName,
                            description: `[Skill: ${skill.definition.displayName}] ${action.description}`,
                            parameters: action.parameters
                        }
                    },
                    handler: async (args: any, { chat }: { chat: any }) => {
                        return await this.runSkill(
                            userId,
                            skill.id,
                            action.name,
                            args,
                            "chat", // Default to chat workspace
                            chat.meta.id
                        );
                    }
                });
            }
        }

        return tools;
    }
}
