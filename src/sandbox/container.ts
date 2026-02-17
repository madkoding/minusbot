import Docker from "dockerode";
import path from "node:path";
import { Writable } from "node:stream";
import { Logger } from "../cli/colors";

class MemoryStream extends Writable {
    private chunks: Buffer[] = [];

    override _write(chunk: any, encoding: BufferEncoding, callback: (error?: Error | null) => void) {
        this.chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
        callback();
    }

    override toString() {
        return Buffer.concat(this.chunks).toString("utf-8");
    }
}

export class SandboxManager {
    public static readonly docker = new Docker({
        socketPath: "/var/run/docker.sock"
    });

    public static async imageExists(image: string): Promise<boolean> {
        try {
            await this.docker.getImage(image).inspect();
            return true;
        } catch {
            return false;
        }
    }

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
                    } else if (event.stream) {
                        // Optional: log build progress
                        // process.stdout.write(event.stream);
                    }
                });
            });
        });
    }

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

    static async runContainer(
        image: string,
        sourceDir: string,
        workspaceDir: string,
        command: string[],
        env: Record<string, string> = {},
        options: {
            extraVolumes?: string[];
            enableNetwork?: boolean;
            entrypoint?: string[];
            sourceReadOnly?: boolean;
            runtimeMountPoint?: string;
        } = {}
    ): Promise<string> {
        const stream = new MemoryStream();

        try {
            await this.ensureImage(image);

            const absSource = path.resolve(sourceDir);
            const absWorkspace = path.resolve(workspaceDir);

            // Convert env map to array ["KEY=VAL", ...]
            const envArray = Object.entries(env).map(([k, v]) => `${k}=${v}`);
            const mountPoint = options.runtimeMountPoint || "/runtime";

            const binds = [
                `${absSource}:${mountPoint}:${options.sourceReadOnly ?? true ? 'ro' : 'rw'}`,
                `${absWorkspace}:/workspace:rw`
            ];

            if (options.extraVolumes) {
                binds.push(...options.extraVolumes);
            }

            const uid = typeof process.getuid === "function" ? process.getuid() : undefined;
            const gid = typeof process.getgid === "function" ? process.getgid() : undefined;
            const userStr = uid !== undefined ? `${uid}:${gid}` : undefined;

            // Using dockerode run helper
            const [data] = await this.docker.run(
                image,
                command,
                stream,
                {
                    Env: envArray,
                    Entrypoint: options.entrypoint,
                    User: userStr,
                    HostConfig: {
                        Binds: binds,
                        AutoRemove: true,
                        NetworkMode: options.enableNetwork ? "bridge" : "none"
                    },
                    WorkingDir: "/workspace",
                    Tty: false
                }
            );

            const output = stream.toString();

            if (data && data.StatusCode !== 0) {
                // If container failed, we still want the output (stderr)
                // We'll throw an error but include the output message
                throw new Error(`Container exited with code ${data.StatusCode}.\nOutput:\n${output}`);
            }

            return output;
        } catch (e: any) {
            // Rethrow specific errors to keep context
            if (e.message.includes("Container exited")) throw e;
            throw new Error(`Sandbox Execution Failed: ${e.message}`);
        }
    }
}
