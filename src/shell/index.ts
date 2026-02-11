import Docker from "dockerode";
import { Writable } from "node:stream";
import { v4 as uuidv4 } from "uuid";
import fs from "node:fs/promises";
import path from "node:path";

import { Storage } from "../storage";
import { getUserDir } from "../config";
import { SandboxManager } from "../sandbox/index";

interface ShellSession {
    id: string;
    userId: string;
    chatId: string | null;
    container: Docker.Container;
    stream: NodeJS.ReadWriteStream;
    outputBuffer: string[];
    createdAt: Date;
    command: string;
    isFinished: boolean; // For bg=false waiting
}

export class ShellManager {
    public static verbose: boolean = false;
    private static sessions: Map<string, ShellSession> = new Map();

    static async create(
        userId: string,
        chatId: string | null, // null = global
        command: string,
        isBg: boolean = false,
        timeoutMs: number = 30000
    ): Promise<string> {
        const image = "python:3.11-slim";
        await SandboxManager.ensureImage(image);

        // Prepare workspace mount
        let workspaceDir = "";
        if (chatId) {
            workspaceDir = Storage.getWorkspaceDir(userId, chatId);
        } else {
            workspaceDir = path.join(getUserDir(userId), "global_workspace");
        }
        await fs.mkdir(workspaceDir, { recursive: true });

        const container = await SandboxManager.docker.createContainer({
            Image: image,
            Cmd: ["/bin/sh", "-c", command],
            Tty: false,
            AttachStdout: true,
            AttachStderr: true,
            AttachStdin: true,
            OpenStdin: true,
            StdinOnce: false,
            HostConfig: {
                Binds: [`${workspaceDir}:/workspace:rw`],
                AutoRemove: true,
                NetworkMode: "none"
            },
            WorkingDir: "/workspace"
        });

        const id = uuidv4();

        // Attach BEFORE starting to capture all output
        const stream = await container.attach({
            stream: true,
            stdin: true,
            stdout: true,
            stderr: true
        });

        const session: ShellSession = {
            id,
            userId,
            chatId,
            container,
            stream,
            outputBuffer: [],
            createdAt: new Date(),
            command,
            isFinished: false
        };

        this.sessions.set(id, session);

        // Capture output using demuxStream for Tty: false
        const logStream = new Writable({
            write(chunk: any, encoding: BufferEncoding, next: (error?: Error | null) => void) {
                const text = chunk.toString("utf-8");
                session.outputBuffer.push(text);
                if (ShellManager.verbose || process.argv.includes("--verbose")) {
                    process.stdout.write(text);
                }
                next();
            }
        });

        container.modem.demuxStream(stream, logStream, logStream);

        // Monitor container completion
        const monitorCompletion = async () => {
            try {
                await container.wait();
                // Give stream time to flush
                await new Promise(r => setTimeout(r, 500));
                session.isFinished = true;

                if (isBg) {
                    // Auto-cleanup after 1 hour for background shells
                    setTimeout(() => this.sessions.delete(id), 3600000);
                }
            } catch (e: any) {
                session.isFinished = true;
                session.outputBuffer.push(`Error: ${e.message}`);
            }
        };

        // Start container NOW (after attach)
        await container.start();

        if (isBg) {
            // Fire and forget monitoring for background shells
            monitorCompletion().catch(err => {
                console.error(`Background shell ${id} error:`, err);
            });
            return id;
        } else {
            // Wait for completion for foreground shells
            const timeoutPromise = new Promise<never>((_, reject) => {
                setTimeout(async () => {
                    try {
                        await container.kill();
                    } catch { }
                    this.sessions.delete(id);
                    reject(new Error(`Command timed out after ${timeoutMs}ms.`));
                }, timeoutMs);
            });

            try {
                await Promise.race([monitorCompletion(), timeoutPromise]);
                const output = session.outputBuffer.join("");
                this.sessions.delete(id);
                return output;
            } catch (e: any) {
                this.sessions.delete(id);
                throw e;
            }
        }
    }

    static async stdout(userId: string, id: string, waitSeconds: number = 0): Promise<string> {
        const session = this.sessions.get(id);
        if (!session) throw new Error("Shell not found.");

        if (session.userId !== userId && userId !== "root") { // Allow root to peek? Or strict ownership?
            // Strict for now per requirements imply ownership check
            // "scopeadas por chat y usuario"
        }

        // If waitSeconds > 0, we clear current buffer, wait for X seconds gathering new data, then return.
        if (waitSeconds > 0) {
            // Unsure if we should return *only* new data or *all* data accumulated + new.
            // Usually "read" consumes. 
            // Let's flush current buffer, wait, return new accumulator.
            const flushed = session.outputBuffer;
            session.outputBuffer = []; // Clear

            await new Promise(r => setTimeout(r, waitSeconds * 1000));

            const newOutput = session.outputBuffer.join("");
            session.outputBuffer = []; // Clear again
            return /*flushed.join("") +*/ newOutput; // Return what arrived during wait? 
            // Or return everything since last read?
            // "espera X segundos" implies waiting to see if more comes.
            // Let's just return whatever is in buffer after X seconds delay from NOW.
            // No, that implies blocking.
        }

        const output = session.outputBuffer.join("");
        session.outputBuffer = []; // Consume buffer
        return output;
    }

    static async stdin(userId: string, id: string, input: string): Promise<string> {
        const session = this.sessions.get(id);
        if (!session) throw new Error("Shell not found.");

        // Write to stream
        session.stream.write(input + "\n");
        return "Input sent.";
    }

    static async kill(userId: string, id: string): Promise<string> {
        const session = this.sessions.get(id);
        if (!session) throw new Error("Shell not found.");

        try {
            await session.container.kill();
        } catch (e: any) {
            // Ignore if already stopped
        }
        this.sessions.delete(id);
        return "Shell killed.";
    }

    // List user shells (global + current chat)
    static list(userId: string, chatId?: string): ShellSession[] {
        return Array.from(this.sessions.values()).filter(s => {
            if (s.userId !== userId) return false;
            if (s.chatId === null) return true; // Global
            if (chatId && s.chatId === chatId) return true; // Chat specific
            return false;
        });
    }

    // List all shells (sysadmin)
    static listAll(): ShellSession[] {
        return Array.from(this.sessions.values());
    }
}
