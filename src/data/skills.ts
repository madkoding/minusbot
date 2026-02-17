import path from "node:path";
import fs from "node:fs/promises";
import os from "node:os";

import { SHARED_SKILLS_DIR, getUserDir, getUserSettings, getUserIntegrationConfigFile } from "./storage";
import { SandboxManager } from "../sandbox/container";
import { WorkspaceManager } from "./workspaces";
import { secrets } from "../secrets";
import { Logger } from "../cli/colors";

export interface BinaryDefinition {
    name: string;
    urls: Record<string, string>;
    actions: string[];
}

export interface SkillAction {
    name: string;
    description: string;
    parameters: any;
    _script: string;
    dockerImage?: string;
    extraVolumes?: string[];
    enableNetwork?: boolean;
    networkMode?: "bridge" | "host" | "none";
    args?: Record<string, any>;
}

export interface SkillDefinition {
    id: string;
    displayName: string;
    description: string;
    vaultKeys?: string[];
    configSchema?: any;
    bins?: BinaryDefinition[];
    dockerImage?: string;
    enableNetwork?: boolean;
    networkMode?: "bridge" | "host" | "none";
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

    private static async ensureBinaries(skillPath: string, actionName: string, definition: SkillDefinition) {
        if (!definition.bins || !Array.isArray(definition.bins)) return;

        const binDir = path.join(skillPath, "bin");
        await fs.mkdir(binDir, { recursive: true });

        const arch = `${os.platform()}-${os.arch()}`;
        const archAliases: Record<string, string> = {
            "linux-x64": "linux-x86_64",
            "linux-arm64": "linux-aarch64",
            "linux-x86_64": "linux-x64",
            "linux-aarch64": "linux-arm64"
        };

        for (const binDef of definition.bins) {
            if (!binDef.actions.includes(actionName)) continue;

            const binName = binDef.name;
            const binPath = path.join(binDir, binName);
            const exists = await fs.stat(binPath).catch(() => null);

            if (!exists) {
                const url = binDef.urls[arch] ||
                    binDef.urls[archAliases[arch] || ""] ||
                    binDef.urls["all"] ||
                    binDef.urls["default"];

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
                            } catch (unzipErr: any) {
                                await Logger.error(`Unzip failed: ${unzipErr.message}. Make sure 'unzip' is installed.`);
                            } finally {
                                await fs.unlink(zipPath).catch(() => { });
                            }
                        } else if (url.endsWith(".tar.gz") || url.endsWith(".tgz")) {
                            const tarPath = `${binPath}.tar.gz`;
                            await fs.writeFile(tarPath, buffer);

                            const { execSync } = await import("node:child_process");
                            try {
                                execSync(`tar -xzf "${tarPath}" -C "${binDir}"`);
                            } catch (tarErr: any) {
                                await Logger.error(`Tar extraction failed: ${tarErr.message}. Make sure 'tar' is installed.`);
                            } finally {
                                await fs.unlink(tarPath).catch(() => { });
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
        await this.ensureBinaries(skillPath, actionName, skill.definition);

        const workspaceDir = WorkspaceManager.resolveContentPath(userId, workspaceId, chatId);
        await fs.mkdir(workspaceDir, { recursive: true });

        // Ensure and mount data directory
        const { getUserSkillDataDir } = await import("./storage");
        const dataDir = getUserSkillDataDir(userId, id);
        await fs.mkdir(dataDir, { recursive: true });

        // Load Vault
        const vaultId = `skill_${id}`; // Matching user preference skill_(id)
        const vault = await secrets.vault(userId, vaultId);
        const envSecrets = vault.allValues();

        // Load Config
        // Config can be global (in skill.json) or user-specific (overridden)
        // For simplicity, we use getUserIntegrationConfigFile as the storage for custom user config
        const configPath = getUserIntegrationConfigFile(userId, vaultId);
        let configEnv: Record<string, string> = {};

        // Load default config from definition
        const defaultConfig = skill.definition.configSchema?.default || {};

        try {
            const configContent = await fs.readFile(configPath, "utf-8");
            const userConfig = JSON.parse(configContent);
            const mergedConfig = { ...defaultConfig, ...userConfig };
            for (const [key, value] of Object.entries(mergedConfig)) {
                configEnv[`CONFIG_${key}`] = String(value);
            }
        } catch {
            for (const [key, value] of Object.entries(defaultConfig)) {
                configEnv[`CONFIG_${key}`] = String(value);
            }
        }

        const env = {
            ...envSecrets,
            ...configEnv,
            PATH: `/skill/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin`
        };

        let dockerImage = action.dockerImage || skill.definition.dockerImage || "python:3.11-slim";

        // Handle custom Dockerfile
        if (dockerImage === "custom") {
            const sanitizedUserId = userId.replace(/[^a-z0-9]/gi, '_').toLowerCase();
            const tag = `minusbot_skill_${skill.isGlobal ? 'global' : 'user_' + sanitizedUserId}_${skill.id.toLowerCase()}`;

            const exists = await SandboxManager.imageExists(tag);
            if (!exists) {
                await SandboxManager.buildImage(skillPath, tag);
            }
            dockerImage = tag;
        }

        const scriptExt = path.extname(action._script).toLowerCase();

        let cmd: string[] = [];
        let entrypoint: string[] | undefined = undefined;

        const payload = JSON.stringify({ ...action.args, ...inputs, _action: actionName, _skillId: id });

        if (scriptExt === ".py") {
            cmd = ["python", `/skill/scripts/${action._script}`, payload];
        } else if (scriptExt === ".sh") {
            // If image is alpine/git or similar with custom entrypoints, override it
            if (dockerImage.includes("git")) {
                entrypoint = ["/bin/sh"];
                cmd = ["/skill/scripts/" + action._script, payload];
            } else {
                cmd = ["sh", `/skill/scripts/${action._script}`, payload];
            }
        } else {
            // Default to direct execution
            cmd = [`/skill/scripts/${action._script}`, payload];
        }

        // Use SandboxManager
        return await SandboxManager.runContainer(
            dockerImage,
            skillPath,
            workspaceDir,
            cmd,
            env,
            {
                extraVolumes: [
                    ...(action.extraVolumes || []),
                    `${dataDir}:/data:rw` // Mount user data as /data
                ],
                enableNetwork: action.enableNetwork || skill.definition.enableNetwork,
                networkMode: action.networkMode || skill.definition.networkMode,
                entrypoint,
                runtimeMountPoint: "/skill"
            }
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

    static async listSkillFiles(userId: string, id: string): Promise<string[]> {
        const { getUserSkillDataDir } = await import("./storage");
        const dataDir = getUserSkillDataDir(userId, id);
        try {
            return await fs.readdir(dataDir);
        } catch {
            return [];
        }
    }

    static async getSkillFile(userId: string, id: string, filename: string): Promise<string> {
        const { getUserSkillDataDir } = await import("./storage");
        const dataDir = getUserSkillDataDir(userId, id);
        const filePath = path.join(dataDir, filename);
        try {
            return await fs.readFile(filePath, "utf-8");
        } catch {
            return "";
        }
    }

    static async saveSkillFile(userId: string, id: string, filename: string, content: string) {
        const { getUserSkillDataDir } = await import("./storage");
        const dataDir = getUserSkillDataDir(userId, id);
        await fs.mkdir(dataDir, { recursive: true });
        const filePath = path.join(dataDir, filename);
        await fs.writeFile(filePath, content, "utf-8");
    }
}
