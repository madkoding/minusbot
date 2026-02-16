import os from "node:os";
import path from "node:path";
import fs from "node:fs/promises";

// Path Constants
export const APP_NAME = "minusbot";
export const CONFIG_DIR = path.join(os.homedir(), ".config", APP_NAME);
export const USERS_DIR = path.join(CONFIG_DIR, "users");
export const SHARED_DIR = path.join(CONFIG_DIR, "shared");

// System Settings (Root only)
export const SYSTEM_SETTINGS_FILE = path.join(CONFIG_DIR, "system-settings.json");

// Shared Folders
export const SHARED_SKILLS_DIR = path.join(SHARED_DIR, "skills");
export const SHARED_SECRETS_DIR = path.join(SHARED_DIR, "secrets");
export const SHARED_STATS_FILE = path.join(SHARED_DIR, "stats.json");
export const GLOBAL_SETTINGS_FILE = path.join(SHARED_DIR, "global-settings.json");
export const GLOBAL_INTEGRATIONS_DIR = path.join(SHARED_DIR, "integrations");

// --- Interfaces & Types ---

export interface SystemSettings {
    web_port: number;
    updater_channel: "stable" | "nightly" | "development";
    updater_stable_url: string;
    updater_nightly_url: string;
}

export interface Settings {
    model_id: string;
    ai_endpoint: string;
    colors: boolean;
    disabled_tools: string[];
    disabled_skills: string[];
    debug?: boolean;
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
    model_id: "gpt-4o",
    ai_endpoint: "https://api.openai.com/v1",
    colors: true,
    disabled_tools: [],
    disabled_skills: [],
    debug: false
};

export const DEFAULT_SYSTEM_SETTINGS: SystemSettings = {
    web_port: 9753,
    updater_channel: "stable",
    updater_stable_url: "https://raw.githubusercontent.com/sammwyy/minusbot/stable/versions.json",
    updater_nightly_url: "https://raw.githubusercontent.com/sammwyy/minusbot/nightly/versions.json"
};

// --- Settings Persistence ---

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

export function getGlobalIntegrationsDir() {
    return GLOBAL_INTEGRATIONS_DIR;
}

export function getGlobalIntegrationConfigFile(integrationId: string) {
    return path.join(getGlobalIntegrationsDir(), `${integrationId}.json`);
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
            model_id: userSettings.model_id ?? global.model_id,
            ai_endpoint: userSettings.ai_endpoint ?? global.ai_endpoint,
            colors: userSettings.colors ?? global.colors,
            disabled_tools: userSettings.disabled_tools ?? global.disabled_tools ?? [],
            disabled_skills: userSettings.disabled_skills ?? global.disabled_skills ?? [],
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

export async function ensureDirs() {
    await fs.mkdir(USERS_DIR, { recursive: true });
    await fs.mkdir(SHARED_DIR, { recursive: true });
    await fs.mkdir(SHARED_SKILLS_DIR, { recursive: true });
    await fs.mkdir(SHARED_SECRETS_DIR, { recursive: true });
    await fs.mkdir(GLOBAL_INTEGRATIONS_DIR, { recursive: true });
    await getJWTSecret();
}
