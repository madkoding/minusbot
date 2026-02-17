import { io, Socket } from 'socket.io-client';

type MessageHandler = (message: any) => void;
type ConnectionHandler = (connected: boolean) => void;
type ErrorHandler = (error: string) => void;

export class ChatClient {
    private socket: Socket | null = null;
    private messageHandlers: Set<MessageHandler> = new Set();
    private connectionHandlers: Set<ConnectionHandler> = new Set();
    private errorHandlers: Set<ErrorHandler> = new Set();
    private currentChatId: string | null = null;

    constructor() {
        this.connect();
    }

    private connect() {
        const token = localStorage.getItem('token');
        if (!token) {
            this.notifyError('No authentication token found');
            return;
        }

        const isDev = import.meta.env.DEV;
        const url = isDev ? 'http://localhost:9753' : window.location.origin;

        try {
            this.socket = io(url, {
                autoConnect: true,
                reconnection: true,
                reconnectionAttempts: 5,
                reconnectionDelay: 1000,
                reconnectionDelayMax: 5000,
            });

            this.socket.on('connect', () => {
                console.log('[ChatClient] Socket.IO connected');
                this.socket?.emit('auth', { token });
            });

            this.socket.on('auth_success', () => {
                console.log('[ChatClient] Authenticated successfully');
                this.notifyConnection(true);

                // Re-initialize current chat if any
                if (this.currentChatId) {
                    this.switchChat(this.currentChatId);
                }
            });

            this.socket.on('chat_ready', (data) => {
                this.notifyMessage({ type: 'chat_ready', ...data });
            });

            this.socket.on('chat_event', (data) => {
                this.notifyMessage(data);
            });

            this.socket.on('error', (data) => {
                console.error('[ChatClient] Server error:', data.message);
                this.notifyError(data.message);
            });

            this.socket.on('disconnect', () => {
                console.log('[ChatClient] Socket.IO disconnected');
                this.notifyConnection(false);
            });

            this.socket.on('connect_error', (error) => {
                console.error('[ChatClient] Connection error:', error);
                this.notifyError('Connection error');
            });
        } catch (e) {
            console.error('[ChatClient] Failed to create Socket.IO connection:', e);
            this.notifyError('Failed to establish connection');
        }
    }

    switchChat(chatId: string) {
        this.currentChatId = chatId;

        if (this.socket?.connected) {
            this.socket.emit('init_chat', { chatId });
        }
    }

    sendMessage(content: string) {
        if (!this.socket || !this.socket.connected) {
            this.notifyError('Not connected to server');
            return;
        }

        this.socket.emit('message', { content });
    }

    onMessage(handler: MessageHandler) {
        this.messageHandlers.add(handler);
        return () => this.messageHandlers.delete(handler);
    }

    onConnection(handler: ConnectionHandler) {
        this.connectionHandlers.add(handler);
        return () => this.connectionHandlers.delete(handler);
    }

    onError(handler: ErrorHandler) {
        this.errorHandlers.add(handler);
        return () => this.errorHandlers.delete(handler);
    }

    private notifyMessage(message: any) {
        this.messageHandlers.forEach(handler => handler(message));
    }

    private notifyConnection(connected: boolean) {
        this.connectionHandlers.forEach(handler => handler(connected));
    }

    private notifyError(error: string) {
        this.errorHandlers.forEach(handler => handler(error));
    }

    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
    }

    isConnected(): boolean {
        return this.socket?.connected || false;
    }
}

// Singleton instance
let chatClientInstance: ChatClient | null = null;

export function getChatClient(): ChatClient {
    if (!chatClientInstance) {
        chatClientInstance = new ChatClient();
    }
    return chatClientInstance;
}
