import Docker from "dockerode";
import path from "node:path";
import { Writable } from "node:stream";

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

    public static async ensureImage(image: string) {
        try {
            await this.docker.getImage(image).inspect();
            return;
        } catch (e: any) {
            if (e.statusCode !== 404) throw e;
        }

        console.log(`Pulling image ${image}...`);
        await new Promise((resolve, reject) => {
            this.docker.pull(image, (err: any, stream: any) => {
                if (err) return reject(err);
                this.docker.modem.followProgress(stream, (err: any, output: any) => {
                    if (err) return reject(err);
                    resolve(output);
                });
            });
        });
        console.log(`Image ${image} pulled successfully.`);
    }

    static async runContainer(
        image: string,
        sourceDir: string,
        workspaceDir: string,
        command: string[]
    ): Promise<string> {
        const stream = new MemoryStream();

        try {
            await this.ensureImage(image);

            const absSource = path.resolve(sourceDir);
            const absWorkspace = path.resolve(workspaceDir);

            // Using dockerode run helper
            const [data] = await this.docker.run(
                image,
                command,
                stream,
                {
                    HostConfig: {
                        Binds: [
                            `${absSource}:/app:ro`,
                            `${absWorkspace}:/workspace:rw`
                        ],
                        AutoRemove: true,
                        NetworkMode: "none"
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
