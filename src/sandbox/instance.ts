import { Logger } from "@/cli/colors";
import Docker from "dockerode";
import { Writable } from "node:stream";

/**
 * MemoryStream: Captures container output in memory with optional debug logging
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

    getBuffer(): Buffer {
        return Buffer.concat(this.chunks);
    }

    override toString(): string {
        return this.getBuffer().toString("utf-8");
    }

    /**
     * Get last N bytes from the buffer
     */
    tail(bytes: number): string {
        const buffer = this.getBuffer();
        const start = Math.max(0, buffer.length - bytes);
        return buffer.slice(start).toString("utf-8");
    }

    /**
     * Clear the buffer to prevent memory leaks
     */
    clear() {
        this.chunks = [];
    }

    /**
     * Limit buffer size to prevent memory leaks
     */
    limitSize(maxBytes: number) {
        const buffer = this.getBuffer();
        if (buffer.length > maxBytes) {
            this.chunks = [buffer.slice(buffer.length - maxBytes)];
        }
    }
}

/**
 * SandboxInstance: Manages a running Docker container with full control
 */
export class SandboxInstance {
    private container: Docker.Container;
    private stream: NodeJS.ReadWriteStream | null = null;
    private memoryStream: MemoryStream;
    private isAttached: boolean = false;
    private isRunning: boolean = false;
    private maxBufferSize: number;

    constructor(
        container: Docker.Container,
        options: {
            maxBufferSize?: number;
        } = {}
    ) {
        this.container = container;
        this.memoryStream = new MemoryStream();
        this.maxBufferSize = options.maxBufferSize || 1024 * 1024; // 1MB default
    }

    /**
     * Start background log capture and input handling
     * This is NON-BLOCKING to avoid freezing the startup flow
     */
    async startBackgroundHandlers(options: { tty?: boolean } = {}) {
        if (this.isAttached) return;
        this.isAttached = true;
        this.isRunning = true;

        const hasTty = options.tty ?? false;

        // Background log capture using logs() instead of attach() for more stability
        // follow: true makes it a stream, but we don't await the end of the stream
        try {
            const logStream = await this.container.logs({
                follow: true,
                stdout: true,
                stderr: true,
                timestamps: false
            }) as any;

            if (hasTty) {
                logStream.on("data", (chunk: Buffer) => {
                    this.memoryStream.write(chunk);
                    this.memoryStream.limitSize(this.maxBufferSize);
                });
            } else {
                this.container.modem.demuxStream(logStream, this.memoryStream, this.memoryStream);
            }

            logStream.on("error", (err: any) => {
                Logger.error(`Log stream error: ${err.message}`);
                this.isAttached = false;
            });

            logStream.on("end", () => {
                this.isRunning = false;
                this.isAttached = false;
            });
        } catch (e: any) {
            Logger.error(`Failed to start log capture: ${e.message}`);
            this.isAttached = false;
        }
    }

    /**
     * Write to container stdin on-demand
     */
    async write(input: string): Promise<boolean> {
        try {
            const stream = await this.container.attach({
                stream: true,
                stdin: true,
                stdout: false,
                stderr: false,
                hijack: true
            });
            stream.write(input);
            stream.end();
            return true;
        } catch (e: any) {
            Logger.error(`Write failed: ${e.message}`);
            return false;
        }
    }

    /**
     * Get stdout buffer as string
     */
    getStdout(): string {
        return this.memoryStream.toString();
    }

    /**
     * Get last N bytes from stdout
     */
    getStdoutTail(bytes: number): string {
        return this.memoryStream.tail(bytes);
    }

    /**
     * Wait for N milliseconds and return new output during that period
     */
    async waitAndRead(ms: number): Promise<string> {
        const startLength = this.memoryStream.toString().length;
        await new Promise(resolve => setTimeout(resolve, ms));
        const fullOutput = this.memoryStream.toString();
        return fullOutput.substring(startLength);
    }

    /**
     * Clear the output buffer
     */
    clearBuffer() {
        this.memoryStream.clear();
    }

    /**
     * Wait for container to finish
     */
    async wait(): Promise<{ StatusCode: number }> {
        return await this.container.wait();
    }

    /**
     * Kill the container
     */
    async kill(signal?: string) {
        if (!this.isRunning) return;
        try {
            await this.container.kill({ signal });
        } catch (e: any) {
            // Ignore if already stopped
            if (e.statusCode !== 404 && !e.message.includes("404")) {
                throw e;
            }
        }
        this.isRunning = false;
    }

    /**
     * Stop the container gracefully
     */
    async stop(timeout?: number) {
        if (!this.isRunning) return;
        try {
            await this.container.stop({ t: timeout });
        } catch (e: any) {
            // Ignore if already stopped
            if (e.statusCode !== 404 && !e.message.includes("404")) {
                throw e;
            }
        }
        this.isRunning = false;
    }

    /**
     * Remove the container (force if needed)
     */
    async remove(force: boolean = true) {
        try {
            await this.container.remove({ force, v: true });
        } catch (e: any) {
            // Ignore 404 errors (already removed)
            if (e.statusCode !== 404 && !e.message.includes("404")) {
                throw e;
            }
        }
        this.isRunning = false;
    }

    /**
     * Execute a command in the running container
     */
    async exec(cmd: string[], options: {
        stdin?: boolean;
        stdout?: boolean;
        stderr?: boolean;
        tty?: boolean;
    } = {}): Promise<string> {
        const exec = await this.container.exec({
            Cmd: cmd,
            AttachStdin: options.stdin ?? false,
            AttachStdout: options.stdout ?? true,
            AttachStderr: options.stderr ?? true,
            Tty: options.tty ?? false
        });

        const stream = new MemoryStream();
        const execStream = await exec.start({ Detach: false, Tty: options.tty ?? false });

        execStream.on("data", (chunk: Buffer) => {
            stream.write(chunk);
        });

        return new Promise((resolve, reject) => {
            execStream.on("end", () => resolve(stream.toString()));
            execStream.on("error", reject);
        });
    }

    /**
     * Get container ID
     */
    getId(): string {
        return this.container.id;
    }

    /**
     * Get container info
     */
    async inspect() {
        return await this.container.inspect();
    }

    /**
     * Check if container is running
     */
    getIsRunning(): boolean {
        return this.isRunning;
    }

    /**
     * Get the underlying Docker container
     */
    getContainer(): Docker.Container {
        return this.container;
    }

    /**
     * Get the memory stream
     */
    getMemoryStream(): MemoryStream {
        return this.memoryStream;
    }
}
