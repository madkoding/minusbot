import fs from "node:fs/promises";
import path from "node:path";

import { SandboxManager } from "../sandbox/container";
import { getUserDir, SHARED_DIR } from "../data/storage";

export interface BrowserStep {
    action: "click" | "type" | "wait" | "navigate";
    selector?: string;
    text?: string;
    url?: string;
}

export interface BrowserScript {
    id: string;
    name: string;
    description: string;
    targetUrl: string;
    steps: BrowserStep[];
}

export class BrowserManager {
    private static readonly RUNTIME_PATH = path.join(process.cwd(), "src/browser/runtime");

    static getScriptsDir(userId: string) {
        return path.join(getUserDir(userId), "browser-scripts");
    }

    static async listScripts(userId: string): Promise<BrowserScript[]> {
        const dir = this.getScriptsDir(userId);
        try {
            const files = await fs.readdir(dir);
            const scripts: BrowserScript[] = [];
            for (const file of files) {
                if (file.endsWith(".json")) {
                    const content = await fs.readFile(path.join(dir, file), "utf-8");
                    scripts.push(JSON.parse(content));
                }
            }
            return scripts;
        } catch {
            return [];
        }
    }

    static async saveScript(userId: string, script: BrowserScript) {
        const dir = this.getScriptsDir(userId);
        await fs.mkdir(dir, { recursive: true });
        await fs.writeFile(path.join(dir, `${script.id}.json`), JSON.stringify(script, null, 2));
    }

    static async execute(userId: string, action: "pilot" | "execute", options: {
        url?: string,
        steps?: BrowserStep[],
        scriptId?: string
    }): Promise<any> {
        let targetUrl = options.url;
        let targetSteps = options.steps || [];

        if (options.scriptId) {
            const scripts = await this.listScripts(userId);
            const script = scripts.find(s => s.id === options.scriptId);
            if (!script) throw new Error(`Script ${options.scriptId} not found`);

            if (!targetUrl) targetUrl = script.targetUrl;
            if (targetSteps.length === 0) targetSteps = script.steps;
        }

        if (!targetUrl) throw new Error("A target URL is required for browser operations.");

        const cacheDir = path.join(SHARED_DIR, "browser-cache/node_modules");
        await fs.mkdir(cacheDir, { recursive: true });

        const cmd = [
            "sh", "-c",
            `cd /browser && [ ! -d "node_modules" ] || [ ! -f "node_modules/.bin/ts-node" ] && npm install --no-audit --no-fund; npx ts-node --project /browser/tsconfig.json /browser/index.ts '${JSON.stringify({ action, url: targetUrl, steps: targetSteps })}'`
        ];

        const output = await SandboxManager.runContainer(
            "mcr.microsoft.com/playwright:v1.41.0-jammy",
            cmd,
            {
                networkMode: "host",
                workingDir: "/browser",
                binds: [
                    {
                        host: this.RUNTIME_PATH,
                        mount: "/browser",
                        writable: true
                    },
                    {
                        host: this.getScriptsDir(userId),
                        mount: "/workspace",
                        writable: true
                    },
                    {
                        host: cacheDir,
                        mount: "/browser/node_modules",
                        writable: true
                    }
                ]
            }
        ) as string;

        try {
            const jsonStart = output.lastIndexOf('{"success"');
            if (jsonStart === -1) throw new Error("No JSON found in output");
            const cleanOutput = output.substring(jsonStart);
            return JSON.parse(cleanOutput);
        } catch (e: any) {
            return { success: false, error: `Browser execution error: ${e.message}`, raw: output };
        }
    }
}
