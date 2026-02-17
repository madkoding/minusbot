import type { Socket } from "socket.io";
import { Channel } from "../channel-base";
import type { ChannelSchema } from "../channel-base";
import { PubSub } from "@/pubsub";
import { InputProcessor } from "@/processor";
import { Storage, getUserSettings } from "@/data/storage";

export class WebChannel extends Channel {
    static readonly ID = "web";

    readonly id = WebChannel.ID;
    readonly name = "Web Dashboard";
    readonly description = "Enables real-time communication via the official Web Interface.";
    readonly icon = "🌐";

    readonly schema: ChannelSchema = {
        id: this.id,
        name: this.name,
        description: this.description,
        icon: this.icon,
        fields: []
    };

    private sockets: Map<Socket, { chatId: string | null, listener: ((data: any) => void) | null }> = new Map();

    async start() {
        // Web channel is reactive, no background tasks needed
    }

    async stop() {
        for (const [socket, state] of this.sockets) {
            if (state.chatId && state.listener) {
                PubSub.unsubscribe(`chat:${state.chatId}`, state.listener);
            }
            socket.disconnect();
        }
        this.sockets.clear();
    }

    async sendFile(filePath: string, filename?: string) {
        // Sending files to web is handled via PubSub/Workspace notifications
    }

    /**
     * Hand over a Socket.IO connection to this channel for management.
     */
    handleSocket(socket: Socket) {
        const state: { chatId: string | null, listener: ((data: any) => void) | null } = {
            chatId: null,
            listener: null
        };

        this.sockets.set(socket, state);

        socket.on("init_chat", async (data) => {
            try {
                await this.initChat(socket, data.chatId);
            } catch (e: any) {
                socket.emit("error", { message: "Internal error initializing chat" });
            }
        });

        socket.on("message", async (data) => {
            try {
                const targetChatId = data.chatId || state.chatId;

                if (!targetChatId) {
                    return socket.emit("error", { message: "No active chat initialized" });
                }

                // If message comes with a different chatId, initialize it first
                if (data.chatId && data.chatId !== state.chatId) {
                    await this.initChat(socket, data.chatId);
                }

                await InputProcessor.process(data.content, this.user.id, targetChatId, {
                    _channel: this.id,
                    _internal_source_web: true
                });
            } catch (e: any) {
                socket.emit("error", { message: "Internal error processing message" });
            }
        });

        socket.on("disconnect", () => {
            if (state.chatId && state.listener) {
                PubSub.unsubscribe(`chat:${state.chatId}`, state.listener);
            }
            this.sockets.delete(socket);
        });
    }

    private async initChat(socket: Socket, chatId?: string) {
        const state = this.sockets.get(socket);
        if (!state) return;

        // Unsubscribe from previous if exists
        if (state.chatId && state.listener) {
            PubSub.unsubscribe(`chat:${state.chatId}`, state.listener);
        }

        let chat = chatId ? await Storage.getChat(this.user.id, chatId) : null;

        // Auto-create chat if missing
        if (!chat) {
            const id = chatId || `web_${Math.random().toString(36).substring(7)}`;
            chat = {
                meta: {
                    id,
                    type: chatId ? "permanent" : "temporal",
                    last_activity: new Date().toISOString(),
                    message_count: 0,
                    owner: this.user.id
                },
                messages: []
            };
            await Storage.saveChat(chat);
        }

        state.chatId = chat.meta.id;
        state.listener = async (event: any) => {
            const settings = await getUserSettings(this.user.id);

            // Filter events based on debug mode if it's a message
            if (!settings.debug && event.type === "message") {
                if (event.message.role === "tool") return;
            }

            socket.emit("chat_event", event);
        };

        PubSub.subscribe(`chat:${state.chatId}`, state.listener);

        const settings = await getUserSettings(this.user.id);
        const history = settings.debug ? chat.messages : chat.messages.filter(m => m.role !== "tool");

        socket.emit("chat_ready", {
            chatId: chat.meta.id,
            messages: history
        });
    }
}
