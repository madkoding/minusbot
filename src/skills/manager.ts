
import path from "node:path";
import fs from "node:fs/promises";
import os from "node:os";

import { SHARED_SKILLS_DIR, getUserDir, getUserSettings, getUserSkillsDataDir } from "../data/storage";
import { SandboxManager } from "../sandbox/container";
import { WorkspaceManager } from "../data/workspaces";
import { secrets } from "../secrets";
import { Logger } from "../cli/colors";
import type { Skill, SkillDefinition, SkillInstance } from "./types";
import { v4 as uuidv4 } from "uuid";
import { SandboxInstance } from "../sandbox/instance";

export class SkillManager {
    private static globalSkills: Map<string, Skill> = new Map();
    private static userSkillsCache: Map<string, Map<string, Skill>> = new Map();
    private static initialized = false;
    private static sessions: Map<string, SkillInstance> = new Map();

    // Helper to get directory path for user skills
    static getUserSkillsDir(userId: string) {
        return path.join(getUserDir(userId), "skills");
    }

    /**
     * Initialize the Skill Manager by loading global skills.
     */
    static async init() {
        if (this.initialized) return;
        await this.reloadGlobal();
        this.initialized = true;
        Logger.info(`SkillManager initialized. Loaded ${this.globalSkills.size} global skills.`);
    }

    /**
     * Load skills from a directory.
     */
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
                        const content = await fs.readFile(jsonPath, "utf-8");
                        const definition = JSON.parse(content) as SkillDefinition;
                        const enabled = definition.enabled !== false;
                        skills.push({
                            id: folder,
                            definition,
                            enabled,
                            isGlobal,
                            path: skillPath
                        });
                    } catch (e: any) {
                        Logger.warn(`Failed to load skill from ${skillPath}: ${e.message}`);
                    }
                }
            }
            return skills;
        } catch (e) {
            // Directory might not exist
            return [];
        }
    }

    /**
     * Reload global skills cache.
     */
    static async reloadGlobal() {
        this.globalSkills.clear();
        const skills = await this.listFromDir(SHARED_SKILLS_DIR, true);
        for (const skill of skills) {
            this.globalSkills.set(skill.id, skill);
        }
    }

    /**
     * Load or reload a specific user's skills into cache.
     */
    static async loadUserSkills(userId: string) {
        const skills = await this.listFromDir(this.getUserSkillsDir(userId), false);
        const skillMap = new Map<string, Skill>();
        for (const skill of skills) {
            skillMap.set(skill.id, skill);
        }
        this.userSkillsCache.set(userId, skillMap);
        return skillMap;
    }

    /**
     * Reload a user's skills. Alias for loadUserSkills.
     */
    static async reloadUser(userId: string) {
        await this.loadUserSkills(userId);
    }

    /**
     * Get all available skills for a user (Global + User specific).
     * User settings can disable global skills.
     */
    static async listSkills(userId?: string): Promise<Skill[]> {
        if (!this.initialized) await this.init();

        // Start with global skills
        const merged = new Map<string, Skill>();

        // Add global skills first
        this.globalSkills.forEach(s => {
            if (s.enabled) merged.set(s.id, s);
        });

        if (!userId) {
            return Array.from(merged.values());
        }

        // Ensure user cache is loaded
        if (!this.userSkillsCache.has(userId)) {
            await this.loadUserSkills(userId);
        }

        const userSkills = this.userSkillsCache.get(userId);
        if (userSkills) {
            userSkills.forEach(s => {
                // User skills override global skills with same ID
                // Unless we want merge logic? Usually local overrides global completely.
                merged.set(s.id, s);
            });
        }

        const result: Skill[] = [];
        for (const skill of merged.values()) {
            result.push(await this.processSkillStatus(userId, skill));
        }

        return result;
    }

    private static async processSkillStatus(userId: string, skill: Skill): Promise<Skill> {
        let enabled = skill.enabled;

        const settings = await getUserSettings(userId);
        if (settings.disabled_skills?.includes(skill.id)) {
            enabled = false;
        }

        // Check secrets
        const requiredKeys = skill.definition.requiredVaultKeys || [];
        if (enabled && requiredKeys.length > 0) {
            const vaultId = `skill_${skill.id}`;
            const vault = await secrets.vault(userId, vaultId);
            const values = vault.allValues();
            const missing = requiredKeys.some((k: string) => !values[k] || values[k].trim() === '');
            if (missing) enabled = false;
        }

        return { ...skill, enabled };
    }

    /**
     * Get a specific skill definition for a user.
     */
    static async getSkill(userId: string, id: string): Promise<Skill | null> {
        if (!this.initialized) await this.init();

        // Check user cache first
        if (!this.userSkillsCache.has(userId)) {
            await this.loadUserSkills(userId);
        }

        const userSkills = this.userSkillsCache.get(userId);
        if (userSkills && userSkills.has(id)) {
            return this.processSkillStatus(userId, userSkills.get(id)!);
        }

        // Fallback to global
        if (this.globalSkills.has(id)) {
            return this.processSkillStatus(userId, this.globalSkills.get(id)!);
        }

        return null;
    }

    // --- Execution Logic ---

    private static async ensureBinaries(skill: Skill, actionName: string) {
        const definition = skill.definition;
        if (!definition.bins || !Array.isArray(definition.bins)) return;

        const binDir = path.join(skill.path, "bin");
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

    private static async resolveSkillConfigEnv(userId: string, skill: Skill): Promise<Record<string, string>> {
        const vaultId = `skill_${skill.id}`;

        // We identify skill config files by user preference
        const { getUserSkillsDataDir } = await import("../data/storage");
        const configPath = path.join(getUserSkillsDataDir(userId), `${vaultId}.json`);

        let configEnv: Record<string, string> = {};
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

        return configEnv;
    }

    static async getSkillConfig(userId: string, skillId: string): Promise<Record<string, any>> {
        const { getUserSkillsDataDir } = await import("../data/storage");
        const vaultId = `skill_${skillId}`;
        const configPath = path.join(getUserSkillsDataDir(userId), `${vaultId}.json`);

        try {
            const content = await fs.readFile(configPath, "utf-8");
            return JSON.parse(content);
        } catch {
            return {};
        }
    }

    static async saveSkillConfig(userId: string, skillId: string, config: any) {
        const { getUserSkillsDataDir } = await import("../data/storage");
        const vaultId = `skill_${skillId}`;
        const configPath = path.join(getUserSkillsDataDir(userId), `${vaultId}.json`);

        await fs.mkdir(path.dirname(configPath), { recursive: true });
        await fs.writeFile(configPath, JSON.stringify(config, null, 4));
    }

    static async runSkill(
        userId: string,
        id: string,
        actionName: string,
        inputs: any,
        workspaceId: string | null | undefined,
        chatId?: string,
        bg: boolean = false
    ): Promise<string> {
        const skill = await this.getSkill(userId, id);
        if (!skill || !skill.enabled) {
            throw new Error(`Skill ${id} is disabled or does not exist.`);
        }

        const action = skill.definition.actions.find(a => a.name === actionName);
        if (!action) {
            throw new Error(`Action ${actionName} not found in skill ${id}.`);
        }

        // Ensure binaries
        await this.ensureBinaries(skill, actionName);

        const workspaceDir = WorkspaceManager.resolveContentPath(userId, workspaceId, chatId);
        await fs.mkdir(workspaceDir, { recursive: true });

        // Ensure and mount data directory
        const { getUserSkillDataDir } = await import("../data/storage");
        const dataDir = getUserSkillDataDir(userId, id);
        await fs.mkdir(dataDir, { recursive: true });

        // Load Vault
        const vaultId = `skill_${id}`;
        const vault = await secrets.vault(userId, vaultId);
        const envSecrets = vault.allValues();

        // Load Config
        // Load Config
        const configEnv = await this.resolveSkillConfigEnv(userId, skill);

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
                // Now using skill.path directly
                await SandboxManager.buildImage(skill.path, tag);
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
            if (dockerImage.includes("git")) {
                entrypoint = ["/bin/sh"];
                cmd = ["/skill/scripts/" + action._script, payload];
            } else {
                cmd = ["sh", `/skill/scripts/${action._script}`, payload];
            }
        } else {
            cmd = [`/skill/scripts/${action._script}`, payload];
        }

        // Prepare volume bindings
        const binds = [
            {
                host: skill.path,
                mount: "/skill",
                writable: false
            },
            {
                host: workspaceDir,
                mount: "/workspace",
                writable: true
            },
            {
                host: dataDir,
                mount: "/data",
                writable: true
            }
        ];

        // Add extra volumes from action configuration
        if (action.extraVolumes) {
            for (const vol of action.extraVolumes) {
                const parts = vol.split(":");
                const hostPath = parts[0] || "";
                const mountPath = parts[1] || "";
                const mode = parts[2];

                if (hostPath && mountPath) {
                    binds.push({
                        host: hostPath,
                        mount: mountPath,
                        writable: mode === "rw"
                    });
                }
            }
        }

        const result = await SandboxManager.runContainer(
            dockerImage,
            cmd,
            {
                binds,
                networkMode: action.networkMode || skill.definition.networkMode || "none",
                entrypoint,
                workingDir: "/workspace",
                env,
                user: action.user || skill.definition.user,
                tty: action.tty || skill.definition.tty || bg, // Default to true if bg for interactivity
                openStdin: action.tty || skill.definition.tty || bg,
                maxMemory: 512, // 512MB limit
                maxCpus: 1, // 1 CPU limit
                timeout: bg ? undefined : 300000, // 5 minutes timeout for one-shot
                interactive: bg
            }
        );

        if (!bg) {
            return result as string;
        }

        const instance = result as SandboxInstance;
        const sessionId = uuidv4();

        const session: SkillInstance = {
            id: sessionId,
            userId,
            skillId: id,
            actionName,
            instance,
            createdAt: new Date(),
            isFinished: false
        };

        this.sessions.set(sessionId, session);

        // Monitor completion for background skills
        const monitorCompletion = async () => {
            try {
                await instance.wait();
            } catch (e: any) {
                if (e.statusCode !== 404 && !e.message.includes("404")) {
                    Logger.error(`Skill instance ${sessionId} error: ${e.message}`);
                }
            } finally {
                session.isFinished = true;
                // Auto-cleanup after 1 hour
                setTimeout(() => this.sessions.delete(sessionId), 3600000);
            }
        };

        monitorCompletion().catch(err => {
            Logger.error(`Error monitoring skill ${sessionId}: ${err.message}`);
        });

        return sessionId;
    }

    // --- Instance Management ---

    static listInstances(userId: string): SkillInstance[] {
        return Array.from(this.sessions.values()).filter(s => s.userId === userId);
    }

    static async killInstance(userId: string, id: string): Promise<string> {
        const session = this.sessions.get(id);
        if (!session) throw new Error("Skill instance not found.");
        if (session.userId !== userId && userId !== "root") throw new Error("Access denied.");

        await session.instance.kill().catch(() => { });
        await session.instance.remove(true).catch(() => { });
        this.sessions.delete(id);
        return "Skill instance killed.";
    }

    static async readInstance(userId: string, id: string, tailBytes: number = 0): Promise<string> {
        const session = this.sessions.get(id);
        if (!session) throw new Error("Skill instance not found.");
        if (session.userId !== userId && userId !== "root") throw new Error("Access denied.");

        if (tailBytes > 0) {
            return session.instance.getStdoutTail(tailBytes);
        }
        return session.instance.getStdout();
    }

    static async writeInstance(userId: string, id: string, input: string): Promise<string> {
        const session = this.sessions.get(id);
        if (!session) throw new Error("Skill instance not found.");
        if (session.userId !== userId && userId !== "root") throw new Error("Access denied.");

        await session.instance.write(input + "\n");
        return "Input sent to skill instance.";
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
                        // Support background execution via 'bg' parameter in args if it exists
                        const bg = action.onlyBg === true || args.bg === true;
                        delete args.bg;

                        return await this.runSkill(
                            userId,
                            skill.id,
                            action.name,
                            args,
                            "chat", // Default to chat workspace
                            chat.meta.id,
                            bg
                        );
                    }
                });
            }
        }

        return tools;
    }

    static async listSkillFiles(userId: string, id: string): Promise<string[]> {
        const { getUserSkillDataDir } = await import("../data/storage");
        const dataDir = getUserSkillDataDir(userId, id);
        try {
            return await fs.readdir(dataDir);
        } catch {
            return [];
        }
    }

    static async getSkillFile(userId: string, id: string, filename: string): Promise<string> {
        const { getUserSkillDataDir } = await import("../data/storage");
        const dataDir = getUserSkillDataDir(userId, id);
        const filePath = path.join(dataDir, filename);
        try {
            return await fs.readFile(filePath, "utf-8");
        } catch {
            return "";
        }
    }

    static async saveSkillFile(userId: string, id: string, filename: string, content: string) {
        const { getUserSkillDataDir } = await import("../data/storage");
        const dataDir = getUserSkillDataDir(userId, id);
        await fs.mkdir(dataDir, { recursive: true });
        const filePath = path.join(dataDir, filename);
        await fs.writeFile(filePath, content, "utf-8");
    }
}
