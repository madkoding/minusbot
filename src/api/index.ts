import express from "express";
import cors from "cors";
import { WebSocketServer, WebSocket } from "ws";
import http from "node:http";
import path from "node:path";
import jwt from "jsonwebtoken";

import { getSystemSettings } from "../config";
import { Logger } from "../colors";
import { UserManager } from "../users";
import { Storage } from "../storage";
import { Agent } from "../agent";

import { PubSub } from "../pubsub";

// Routes
import authRoutes from "./routes/auth";
import chatRoutes from "./routes/chat";

import userAdminRoutes from "./routes/admin/users";
import statsAdminRoutes from "./routes/admin/stats";
import skillsAdminRoutes from "./routes/admin/skills";
import vaultAdminRoutes from "./routes/admin/vault";
import settingsAdminRoutes from "./routes/admin/settings";
import toolsAdminRoutes from "./routes/admin/tools";

import userSkillsRoutes from "./routes/user/skills";
import userSettingsRoutes from "./routes/user/settings";
import userVaultRoutes from "./routes/user/vault";
import userStatsRoutes from "./routes/user/stats";

// Middleware
import { authenticate, adminOnly } from "./middleware/auth";

const JWT_SECRET = process.env.JWT_SECRET || "minusbot-super-secret-123";

export async function startServer() {
    const sys = await getSystemSettings();
    const app = express();
    const server = http.createServer(app);
    const wss = new WebSocketServer({ server });

    const isDev = process.env.NODE_ENV === "dev";

    app.use(cors({
        origin: isDev ? "http://localhost:5173" : true,
        credentials: true
    }));
    app.use(express.json());

    // --- API Routes ---
    const api = express.Router();

    api.use("/auth", authRoutes);
    api.use("/", chatRoutes);

    // User Routes
    const user = express.Router();
    user.use(authenticate);
    user.use("/skills", userSkillsRoutes);
    user.use("/settings", userSettingsRoutes);
    user.use("/vault", userVaultRoutes);
    user.use("/stats", userStatsRoutes);
    api.use("/user", user);

    // Admin Routes
    const admin = express.Router();
    admin.use(authenticate, adminOnly);
    admin.use("/users", userAdminRoutes);
    admin.use("/stats", statsAdminRoutes);
    admin.use("/skills", skillsAdminRoutes);
    admin.use("/vault", vaultAdminRoutes);
    admin.use("/settings", settingsAdminRoutes); // includes /global and /system
    admin.use("/tools", toolsAdminRoutes);
    api.use("/admin", admin);

    app.use("/api", api);

    // --- WebSockets for Chat ---
    wss.on("connection", (ws: WebSocket) => {
        let currentAgent: Agent | null = null;
        let authenticated = false;
        let userId = "";
        let currentChatId: string | null = null;
        let subscriptionHandler: ((data: any) => void) | null = null;

        const close = () => {
            if (currentChatId && subscriptionHandler) {
                PubSub.unsubscribe(`chat:${currentChatId}`, subscriptionHandler);
            }
            ws.close();
        };

        ws.on("close", close);

        ws.on("message", async (data) => {
            try {
                const msg = JSON.parse(data.toString());

                if (msg.type === "auth") {
                    try {
                        const decoded = jwt.verify(msg.token, JWT_SECRET) as any;
                        const session = UserManager.getSession(decoded.sessionId);
                        if (session && session.userId === decoded.userId) {
                            authenticated = true;
                            userId = decoded.userId;
                            ws.send(JSON.stringify({ type: "auth_success" }));
                        } else {
                            ws.send(JSON.stringify({ type: "error", message: "Session expired" }));
                            close();
                        }
                    } catch {
                        ws.send(JSON.stringify({ type: "error", message: "Authentication failed" }));
                        close();
                    }
                    return;
                }

                if (!authenticated) return close();

                if (msg.type === "init_chat") {
                    // Unsubscribe previous
                    if (currentChatId && subscriptionHandler) {
                        PubSub.unsubscribe(`chat:${currentChatId}`, subscriptionHandler);
                    }

                    let chat = msg.chatId ? await Storage.getChat(userId, msg.chatId) : null;
                    if (!chat) {
                        const chatId = `web_${Math.random().toString(36).substring(7)}`;
                        chat = {
                            meta: { id: chatId, type: "temporal", last_activity: new Date().toISOString(), message_count: 0, owner: userId },
                            messages: []
                        };
                        await Storage.saveChat(chat);
                    }

                    // Subscribe new
                    currentChatId = chat.meta.id;
                    subscriptionHandler = (event: any) => {
                        if (ws.readyState === WebSocket.OPEN) {
                            ws.send(JSON.stringify(event));
                        }
                    };
                    PubSub.subscribe(`chat:${currentChatId}`, subscriptionHandler);

                    currentAgent = new Agent(chat);
                    ws.send(JSON.stringify({ type: "chat_ready", chatId: chat.meta.id, messages: chat.messages }));
                }

                if (msg.type === "message" && currentAgent) {
                    try {
                        // Response handled via PubSub events emitted by Agent
                        await currentAgent.run(msg.content);
                    } catch (e: any) {
                        ws.send(JSON.stringify({ type: "error", message: e.message }));
                    }
                }
            } catch (e: any) {
                ws.send(JSON.stringify({ type: "error", message: "Invalid message format" }));
            }
        });
    });

    // Serve Frontend
    const DIST_DIR = path.join(__dirname, "..", "..", "web", "dist");

    if (!isDev) {
        app.use(express.static(DIST_DIR));
        app.use((req, res) => {
            res.sendFile(path.join(DIST_DIR, "index.html"));
        });
    }

    server.listen(sys.web_port, () => {
        Logger.info(`Web API running on http://localhost:${sys.web_port}/api`);
        if (isDev) {
            Logger.info(`Development Frontend should be running on http://localhost:5173`);
        } else {
            Logger.info(`Production Dashboard running on http://localhost:${sys.web_port}`);
        }
    });

    server.on("error", (e: any) => {
        if (e.code === "EADDRINUSE") {
            Logger.warn(`Web API: Port ${sys.web_port} already in use.`);
        } else {
            Logger.error(`Web API Error: ${e.message}`);
        }
    });
}
