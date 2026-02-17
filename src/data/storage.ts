import os from "node:os";
import path from "node:path";
import fs from "node:fs/promises";

// Path Constants - Now as functions to support dynamic MINUSBOT_HOME
export const APP_NAME = "minusbot";

export function getConfigDir(): string {
    return process.env.MINUSBOT_HOME || path.join(os.homedir(), ".config", APP_NAME);
}

export function getUsersDir(): string {
    return path.join(getConfigDir(), "users");
}

export function getSharedDir(): string {
    return path.join(getConfigDir(), "shared");
}

// Backwards compatibility - keep old exports as getters
export const CONFIG_DIR = getConfigDir();
export const USERS_DIR = getUsersDir();
export const SHARED_DIR = getSharedDir();

// System Settings (Root only)
export function getSystemSettingsFile(): string {
    return path.join(getConfigDir(), "system-settings.json");
}

// Shared Folders
export function getSharedSkillsDir(): string {
    return path.join(getSharedDir(), "skills");
}

export function getSharedSecretsDir(): string {
    return path.join(getSharedDir(), "secrets");
}

export function getSharedStatsFile(): string {
    return path.join(getSharedDir(), "stats.json");
}

export function getGlobalSettingsFile(): string {
    return path.join(getSharedDir(), "global-settings.json");
}

// Legacy constant exports
export const SYSTEM_SETTINGS_FILE = getSystemSettingsFile();
export const SHARED_SKILLS_DIR = getSharedSkillsDir();
export const SHARED_SECRETS_DIR = getSharedSecretsDir();
export const SHARED_STATS_FILE = getSharedStatsFile();
export const GLOBAL_SETTINGS_FILE = getGlobalSettingsFile();

// --- Interfaces & Types ---

export interface SystemSettings {
    web_port: number;
    updater_channel: "stable" | "nightly" | "development";
    updater_stable_url: string;
    updater_nightly_url: string;
    system_prompt?: string | null;
}

export interface Settings {
    colors: boolean;
    disabled_tools: string[];
    disabled_skills: string[];
    debug?: boolean;
    active_providers?: {
        text?: string;
        vision?: string;
        image?: string;
        tts?: string;
        stt?: string;
    };
}

export type ChatType = "temporal" | "permanent";

export interface Message {
    role: "user" | "assistant" | "system" | "tool";
    content: string;
    name?: string;
    tool_calls?: any[];
    tool_call_id?: string;
}

export interface ChatMeta {
    id: string;
    type: ChatType;
    last_activity: string;
    title?: string;
    message_count: number;
    owner: string; // User ID
    recentlyFileUploaded?: string[];
    last_channel?: string;
}

export interface Chat {
    meta: ChatMeta;
    messages: Message[];
}

// --- Default Values ---

export const DEFAULT_SETTINGS: Settings = {
    colors: true,
    disabled_tools: [],
    disabled_skills: [],
    active_providers: {},
    debug: false
};

export const DEFAULT_SYSTEM_PROMPT = `You are Minus 🐱🚀 (https://github.com/minusbot-org/minusbot), a secure, open-source AI assistant. 
Persona: Enthusiastic astronaut cat. Be friendly but extremely concise. No info duplication.

MOBILE-FIRST: Use brief, vertical layouts (bullets, bold text). Avoid tables and walls of text.

PRIORITY & TOOLS: 
1. PRIORITIZE SKILLS: Use specialized Skills (git, ffmpeg, etc.) before generic Tools.
2. NO FALLBACK: If a Skill fails, DO NOT use 'shell' as backup; it lacks the necessary binaries.
3. LARGE OUTPUTS: Data >1000 chars (scrapes, logs) is automatically sent as a file. Notify the user when this happens.

MISSION: Zero token waste. Call tools directly without pre-confirmation.`;

export const DEFAULT_SYSTEM_SETTINGS: SystemSettings = {
    web_port: 9753,
    updater_channel: "stable",
    updater_stable_url: "https://raw.githubusercontent.com/minusbot-org/minusbot/stable/versions.json",
    updater_nightly_url: "https://raw.githubusercontent.com/minusbot-org/minusbot/nightly/versions.json",
    system_prompt: DEFAULT_SYSTEM_PROMPT
};

// --- Settings Persistence ---

export async function getSystemSettings(): Promise<SystemSettings> {
    try {
        const content = await fs.readFile(getSystemSettingsFile(), "utf-8");
        const settings = { ...DEFAULT_SYSTEM_SETTINGS, ...JSON.parse(content) };
        if (!settings.system_prompt) {
            settings.system_prompt = DEFAULT_SYSTEM_PROMPT;
        }
        return settings;
    } catch {
        return { ...DEFAULT_SYSTEM_SETTINGS, system_prompt: DEFAULT_SYSTEM_PROMPT };
    }
}

export async function getGlobalSettings(): Promise<Settings> {
    try {
        const content = await fs.readFile(getGlobalSettingsFile(), "utf-8");
        return { ...DEFAULT_SETTINGS, ...JSON.parse(content) };
    } catch {
        return DEFAULT_SETTINGS;
    }
}

export function getUserDir(userId: string) {
    return path.join(getUsersDir(), userId);
}

export function getWorkspacesDir(userId: string) {
    return path.join(getUserDir(userId), "workspaces");
}

export function getUserSettingsFile(userId: string) {
    return path.join(getUserDir(userId), "user-settings.json");
}



export function getUserSkillsDataDir(userId: string) {
    return path.join(getUserDir(userId), "skills-data");
}

export function getUserSkillDataDir(userId: string, skillId: string) {
    return path.join(getUserSkillsDataDir(userId), skillId);
}



export function getUserChannelsDir(userId: string) {
    return path.join(getUserDir(userId), "channels");
}

export function getUserChannelConfigFile(userId: string, channelId: string) {
    return path.join(getUserChannelsDir(userId), `${channelId}.json`);
}

export async function getUserSettings(userId: string): Promise<Settings> {
    const global = await getGlobalSettings();
    try {
        const content = await fs.readFile(getUserSettingsFile(userId), "utf-8");
        const userSettings = JSON.parse(content);
        return {
            colors: userSettings.colors ?? global.colors,
            disabled_tools: userSettings.disabled_tools ?? global.disabled_tools ?? [],
            disabled_skills: userSettings.disabled_skills ?? global.disabled_skills ?? [],
            active_providers: {
                ...global.active_providers,
                ...(userSettings.active_providers || {})
            },
            debug: userSettings.debug ?? global.debug ?? false
        };
    } catch {
        return global;
    }
}

// --- Chat Storage ---

export class Storage {
    static getChatsDir(userId: string) {
        return path.join(getUserDir(userId), "chats");
    }

    static getChatDir(userId: string, chatId: string) {
        return path.join(this.getChatsDir(userId), chatId);
    }

    static getChatContentPath(userId: string, chatId: string) {
        return path.join(this.getChatDir(userId, chatId), "content");
    }

    static async getChat(userId: string, chatId: string): Promise<Chat | null> {
        const chatDir = this.getChatDir(userId, chatId);
        const metaPath = path.join(chatDir, "meta.json");
        const historyPath = path.join(chatDir, "chat.json");

        try {
            const meta = JSON.parse(await fs.readFile(metaPath, "utf-8"));
            const messages = JSON.parse(await fs.readFile(historyPath, "utf-8"));
            return { meta, messages };
        } catch (e) {
            return null;
        }
    }

    static async saveChat(chat: Chat) {
        const userId = chat.meta.owner;
        const chatDir = this.getChatDir(userId, chat.meta.id);
        const contentDir = this.getChatContentPath(userId, chat.meta.id);

        await fs.mkdir(chatDir, { recursive: true });
        await fs.mkdir(contentDir, { recursive: true });

        chat.meta.last_activity = new Date().toISOString();
        chat.meta.message_count = chat.messages.length;

        const metaPath = path.join(chatDir, "meta.json");
        const historyPath = path.join(chatDir, "chat.json");

        const metaToSave = { ...chat.meta };
        delete metaToSave.recentlyFileUploaded;

        await fs.writeFile(metaPath, JSON.stringify(metaToSave, null, 4), "utf-8");
        await fs.writeFile(historyPath, JSON.stringify(chat.messages, null, 4), "utf-8");
    }

    static async listChats(userId: string): Promise<ChatMeta[]> {
        const chatsDir = this.getChatsDir(userId);
        try {
            const dirs = await fs.readdir(chatsDir, { withFileTypes: true });
            const metas: ChatMeta[] = [];

            for (const dir of dirs) {
                if (dir.isDirectory()) {
                    const metaPath = path.join(chatsDir, dir.name, "meta.json");
                    try {
                        const meta = JSON.parse(await fs.readFile(metaPath, "utf-8"));
                        metas.push(meta);
                    } catch (e) { }
                }
            }

            // Sort by last_activity descending (newest first)
            metas.sort((a, b) => {
                const dateA = new Date(a.last_activity || 0).getTime();
                const dateB = new Date(b.last_activity || 0).getTime();
                return dateB - dateA;
            });

            return metas;
        } catch (e) {
            return [];
        }
    }

    static async deleteChat(userId: string, chatId: string) {
        const chatDir = this.getChatDir(userId, chatId);
        await fs.rm(chatDir, { recursive: true, force: true });
    }
}

// --- Upload Logic ---

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

// --- Infrastructure Helpers ---

export function getJWTSecretFile(): string {
    return path.join(getConfigDir(), ".jwt-secret");
}

export const JWT_SECRET_FILE = getJWTSecretFile();
let cachedSecret: string | null = null;

export async function getJWTSecret(): Promise<string> {
    if (cachedSecret) return cachedSecret;

    const jwtFile = getJWTSecretFile();
    try {
        const secret = await fs.readFile(jwtFile, "utf-8");
        cachedSecret = secret.trim();
        return cachedSecret;
    } catch {
        const { randomBytes } = await import("node:crypto");
        const newSecret = randomBytes(64).toString("hex");
        await fs.mkdir(getConfigDir(), { recursive: true });
        await fs.writeFile(jwtFile, newSecret, "utf-8");
        cachedSecret = newSecret;
        return newSecret;
    }
}

export async function ensureDirs() {
    await fs.mkdir(getUsersDir(), { recursive: true });
    await fs.mkdir(getSharedDir(), { recursive: true });
    await fs.mkdir(getSharedSkillsDir(), { recursive: true });
    await fs.mkdir(getSharedSecretsDir(), { recursive: true });
    await getJWTSecret();
}
