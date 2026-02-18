import Docker from "dockerode";
import path from "node:path";
import { Writable } from "node:stream";
import { Logger } from "../cli/colors";
import { SandboxInstance } from "./instance";

/**
 * Simple MemoryStream for capturing output
 */
class MemoryStream extends Writable {
    private chunks: Buffer[] = [];

    override _write(chunk: any, encoding: BufferEncoding, callback: (error?: Error | null) => void) {
        const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
        this.chunks.push(buffer);

        if (process.env.DEBUG || process.env.MINUSBOT_DEBUG) {
            process.stdout.write(buffer);
        }

        callback();
    }

    override toString() {
        return Buffer.concat(this.chunks).toString("utf-8");
    }
}

/**
 * Volume bind configuration
 */
export interface VolumeBinding {
    host: string;
    mount: string;
    writable?: boolean;
}

/**
 * Container run options
 */
export interface RunContainerOptions {
    binds?: VolumeBinding[];
    networkMode?: "bridge" | "host" | "none";
    entrypoint?: string[];
    workingDir?: string;
    env?: Record<string, string>;
    user?: string;
    maxMemory?: number; // in MB
    maxCpus?: number;
    timeout?: number; // in ms
}

/**
 * SandboxManager: Manages Docker containers for sandboxed execution
 */
export class SandboxManager {
    public static readonly docker = new Docker({
        socketPath: "/var/run/docker.sock"
    });

    /**
     * Check if a Docker image exists locally
     */
    public static async imageExists(image: string): Promise<boolean> {
        try {
            await this.docker.getImage(image).inspect();
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Build a Docker image from a directory
     */
    public static async buildImage(dir: string, tag: string) {
        Logger.info(`Building custom image ${tag} from ${dir}...`);

        const { spawn } = await import("node:child_process");
        const tar = spawn("tar", ["-C", dir, "-cf", "-", "."]);

        if (!tar.stdout) {
            throw new Error("Failed to create tar stream for build.");
        }

        return new Promise((resolve, reject) => {
            this.docker.buildImage(tar.stdout as any, { t: tag }, (err, response) => {
                if (err) return reject(err);
                if (!response) return reject(new Error("No response from Docker build."));
                this.docker.modem.followProgress(response, (err, output) => {
                    if (err) return reject(err);
                    Logger.info(`Image ${tag} built successfully.`);
                    resolve(output);
                }, (event) => {
                    if (event.error) {
                        Logger.error(`Build error: ${event.error}`);
                    }
                });
            });
        });
    }

    /**
     * Ensure a Docker image exists (pull if needed)
     */
    public static async ensureImage(image: string) {
        if (await this.imageExists(image)) return;

        Logger.info(`Pulling image ${image}...`);
        await new Promise((resolve, reject) => {
            this.docker.pull(image, (err: any, stream: any) => {
                if (err) return reject(err);
                this.docker.modem.followProgress(stream, (err: any, output: any) => {
                    if (err) return reject(err);
                    resolve(output);
                });
            });
        });
        Logger.info(`Image ${image} pulled successfully.`);
    }

    /**
     * Run a container - handles BOTH one-shot execution AND interactive containers.
     * 
     * @param options.interactive - If true, returns SandboxInstance. If false, returns output string.
     */
    static async runContainer(
        image: string,
        command: string[],
        options: RunContainerOptions & {
            interactive?: boolean;
            tty?: boolean;
            openStdin?: boolean;
            maxBufferSize?: number;
        } = {}
    ): Promise<string | SandboxInstance> {
        await this.ensureImage(image);

        // Common configuration
        const envArray = options.env
            ? Object.entries(options.env).map(([k, v]) => `${k}=${v}`)
            : [];

        const binds = (options.binds || []).map(bind => {
            const absHost = path.resolve(bind.host);
            const mode = bind.writable ? 'rw' : 'ro';
            return `${absHost}:${bind.mount}:${mode}`;
        });

        const userStr = options.user;

        const hostConfig: any = {
            Binds: binds,
            AutoRemove: true,
            NetworkMode: options.networkMode || "none"
        };

        if (options.maxMemory) hostConfig.Memory = options.maxMemory * 1024 * 1024;
        if (options.maxCpus) hostConfig.NanoCpus = options.maxCpus * 1e9;

        const createOptions = {
            Image: image,
            Cmd: command,
            Tty: options.tty || false,
            OpenStdin: options.openStdin || false,
            StdinOnce: false,
            Env: envArray,
            Entrypoint: options.entrypoint,
            User: userStr,
            HostConfig: hostConfig,
            WorkingDir: options.workingDir || "/workspace"
        };

        // --- INTERACTIVE MODE (BACKGROUND) ---
        if (options.interactive) {
            const container = await this.docker.createContainer(createOptions);
            const instance = new SandboxInstance(container, {
                maxBufferSize: options.maxBufferSize
            });

            // Start container first
            await container.start();

            // Start background capture (non-blocking)
            instance.startBackgroundHandlers({
                tty: options.tty ?? false
            }).catch(err => Logger.error(`Background handlers failed: ${err.message}`));

            return instance;
        }

        // --- ONE-SHOT MODE (POWRED BY DOCKER.RUN) ---
        const stream = new MemoryStream();
        try {
            // docker.run handles create -> attach -> start -> wait automatically
            const [data] = await this.docker.run(image, command, stream, createOptions);

            const output = stream.toString();
            if (data && data.StatusCode !== 0) {
                throw new Error(`Exited with code ${data.StatusCode}. Output: ${output}`);
            }

            return output;
        } catch (e: any) {
            if (e.message.includes("Exited with code")) throw e;
            throw new Error(`Sandbox Execution Failed: ${e.message}`);
        }
    }
}
