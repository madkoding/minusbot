import { useEffect, useState, useCallback, useRef } from 'react';
import { getChatClient } from '../lib/chatClient';

export function useChat(chatId?: string) {
    const [messages, setMessages] = useState<any[]>([]);
    const [isConnected, setIsConnected] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const client = getChatClient();

    useEffect(() => {
        // Set initial connection state
        setIsConnected(client.isConnected());

        // Subscribe to connection status
        const unsubConnection = client.onConnection((connected) => {
            setIsConnected(connected);

            // When connected and we have a chatId, initialize the chat
            if (connected && chatId) {
                client.switchChat(chatId);
            }
        });

        // Subscribe to errors
        const unsubError = client.onError((err) => {
            setError(err);
        });

        // Subscribe to messages
        const unsubMessage = client.onMessage((data) => {
            if (data.type === 'chat_ready') {
                setMessages(data.messages || []);
            } else if (data.type === 'message') {
                const msg = data.message;
                // Add client-side timestamp if missing
                if (!msg.timestamp && !msg.created_at) {
                    msg.timestamp = new Date().toISOString();
                }

                setMessages(prev => {
                    // Deduplication logic: prevents adding the exact same message twice within a short window
                    // This handles cases where the server might emit the event and the client receives it back via broadcast echo
                    const last = prev[prev.length - 1];
                    if (last && last.content === msg.content && last.role === msg.role) {
                        const lastTime = new Date(last.timestamp || last.created_at || 0).getTime();
                        const newTime = new Date(msg.timestamp || msg.created_at || 0).getTime();
                        // If messages are identical and received within 500ms, treat as duplicate
                        if (Math.abs(newTime - lastTime) < 500) {
                            return prev;
                        }
                    }
                    return [...prev, msg];
                });
            }
        });

        // Initialize chat if chatId is provided and already connected
        if (chatId && client.isConnected()) {
            // Only switch if we haven't already loaded messages for this chat? 
            // Actually switchChat is idempotent-ish usually, but good practice.
            client.switchChat(chatId);
        }

        return () => {
            unsubConnection();
            unsubError();
            unsubMessage();
        };
    }, [chatId]);

    const sendMessage = useCallback((content: string) => {
        client.sendMessage(content);
    }, []);

    return {
        messages,
        isConnected,
        error,
        sendMessage,
    };
}
