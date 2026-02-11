import { SHARED_SECRETS_DIR, getUserDir } from "./config";
import path from "node:path";
import fs from "node:fs/promises";

export class Vault {
    private data: Record<string, string> = {};

    constructor(private filePath: string) { }

    async load() {
        try {
            const content = await fs.readFile(this.filePath, "utf-8");
            content.split("\n").forEach((line) => {
                const [key, ...rest] = line.split("=");
                if (key && rest.length > 0) {
                    this.data[key.trim()] = rest.join("=").trim();
                }
            });
        } catch { }
    }

    get(key: string): string | undefined {
        return this.data[key];
    }

    listKeys(): string[] {
        return Object.keys(this.data);
    }

    async set(key: string, value: string) {
        this.data[key] = value;
        await this.save();
    }

    async delete(key: string) {
        delete this.data[key];
        await this.save();
    }

    private async save() {
        await fs.mkdir(path.dirname(this.filePath), { recursive: true });
        const content = Object.entries(this.data)
            .map(([k, v]) => `${k}=${v}`)
            .join("\n");
        await fs.writeFile(this.filePath, content, "utf-8");
    }
}

export class MergedVault {
    constructor(private userVault: Vault, private globalVault: Vault) { }

    get(key: string): string | undefined {
        const val = this.userVault.get(key);
        // If empty or undefined, use global
        if (val === undefined || val === "") return this.globalVault.get(key);
        return val;
    }

    listKeys(): string[] {
        return Array.from(new Set([...this.userVault.listKeys(), ...this.globalVault.listKeys()]));
    }

    async set(key: string, value: string) {
        // By default, we set to user vault
        await this.userVault.set(key, value);
    }

    async delete(key: string) {
        await this.userVault.delete(key);
    }
}

export const secrets = {
    async userVault(userId: string, name: string): Promise<Vault> {
        const filePath = path.join(getUserDir(userId), "secrets", `${name}.env`);
        const v = new Vault(filePath);
        await v.load();
        return v;
    },

    async globalVault(name: string): Promise<Vault> {
        const filePath = path.join(SHARED_SECRETS_DIR, `${name}.env`);
        const v = new Vault(filePath);
        await v.load();
        return v;
    },

    async vault(userId: string, name: string): Promise<MergedVault> {
        const uv = await this.userVault(userId, name);
        const gv = await this.globalVault(name);
        return new MergedVault(uv, gv);
    }
};
