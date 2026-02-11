import os from "node:os";
import path from "node:path";
import fs from "node:fs/promises";

export const APP_NAME = "minusbot";
export const CONFIG_DIR = path.join(os.homedir(), ".config", APP_NAME);

// New Directories
export const USERS_DIR = path.join(CONFIG_DIR, "users");
export const SHARED_DIR = path.join(CONFIG_DIR, "shared");

// System Settings (Root only)
export const SYSTEM_SETTINGS_FILE = path.join(CONFIG_DIR, "system-settings.json");

// Shared Folders
export const SHARED_SKILLS_DIR = path.join(SHARED_DIR, "skills");
export const SHARED_SECRETS_DIR = path.join(SHARED_DIR, "secrets");
export const SHARED_STATS_FILE = path.join(SHARED_DIR, "stats.json");
export const GLOBAL_SETTINGS_FILE = path.join(SHARED_DIR, "global-settings.json");

export interface SystemSettings {
    web_port: number;
}

export interface Settings {
    model_id: string;
    ai_endpoint: string;
    colors: boolean;
    disabled_tools: string[];
    disabled_skills: string[];
}

export const DEFAULT_SETTINGS: Settings = {
    model_id: "gpt-4o",
    ai_endpoint: "https://api.openai.com/v1",
    colors: true,
    disabled_tools: [],
    disabled_skills: []
};

export const DEFAULT_SYSTEM_SETTINGS: SystemSettings = {
    web_port: 9753
};

export async function getSystemSettings(): Promise<SystemSettings> {
    try {
        const content = await fs.readFile(SYSTEM_SETTINGS_FILE, "utf-8");
        return { ...DEFAULT_SYSTEM_SETTINGS, ...JSON.parse(content) };
    } catch {
        return DEFAULT_SYSTEM_SETTINGS;
    }
}

export async function getGlobalSettings(): Promise<Settings> {
    try {
        const content = await fs.readFile(GLOBAL_SETTINGS_FILE, "utf-8");
        return { ...DEFAULT_SETTINGS, ...JSON.parse(content) };
    } catch {
        return DEFAULT_SETTINGS;
    }
}

export function getUserDir(userId: string) {
    return path.join(USERS_DIR, userId);
}

export function getWorkspacesDir(userId: string) {
    return path.join(getUserDir(userId), "workspaces");
}

export function getUserSettingsFile(userId: string) {
    return path.join(getUserDir(userId), "user-settings.json");
}

export function getUserIntegrationsDir(userId: string) {
    return path.join(getUserDir(userId), "integrations");
}

export function getUserIntegrationConfigFile(userId: string, integrationId: string) {
    return path.join(getUserIntegrationsDir(userId), `${integrationId}.json`);
}

export async function getUserSettings(userId: string): Promise<Settings> {
    const global = await getGlobalSettings();
    try {
        const content = await fs.readFile(getUserSettingsFile(userId), "utf-8");
        const userSettings = JSON.parse(content);
        return {
            model_id: userSettings.model_id ?? global.model_id,
            ai_endpoint: userSettings.ai_endpoint ?? global.ai_endpoint,
            colors: userSettings.colors ?? global.colors,
            disabled_tools: userSettings.disabled_tools ?? global.disabled_tools ?? [],
            disabled_skills: userSettings.disabled_skills ?? global.disabled_skills ?? []
        };
    } catch {
        return global;
    }
}

// JWT Secret
export const JWT_SECRET_FILE = path.join(CONFIG_DIR, ".jwt-secret");

let cachedSecret: string | null = null;

export async function getJWTSecret(): Promise<string> {
    if (cachedSecret) return cachedSecret;

    try {
        const secret = await fs.readFile(JWT_SECRET_FILE, "utf-8");
        cachedSecret = secret.trim();
        return cachedSecret;
    } catch {
        const { randomBytes } = await import("node:crypto");
        const newSecret = randomBytes(64).toString("hex");
        await fs.mkdir(CONFIG_DIR, { recursive: true });
        await fs.writeFile(JWT_SECRET_FILE, newSecret, "utf-8");
        cachedSecret = newSecret;
        return newSecret;
    }
}

// Helper to ensure base directories exist
export async function ensureDirs() {
    await fs.mkdir(USERS_DIR, { recursive: true });
    await fs.mkdir(SHARED_DIR, { recursive: true });
    await fs.mkdir(SHARED_SKILLS_DIR, { recursive: true });
    await fs.mkdir(SHARED_SECRETS_DIR, { recursive: true });
    await getJWTSecret();
}
