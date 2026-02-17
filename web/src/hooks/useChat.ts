import { useEffect, useCallback } from 'react';
import { getChatClient } from '../lib/chatClient';
import { useChatStore } from '../stores/useChatStore';
import { chatService } from '../services/chatService';

export function useChats() {
    const { userChats, setUserChats, isLoading, setLoading, setError } = useChatStore();

    const fetchChats = useCallback(async () => {
        setLoading(true);
        try {
            const data = await chatService.list();
            setUserChats(data);
            setError(null);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [setLoading, setUserChats, setError]);

    return {
        chats: userChats,
        isLoading,
        fetchChats
    };
}

export function useChatsAsAdmin() {
    const { adminChats, setAdminChats, isLoading, setLoading, setError } = useChatStore();

    const fetchChats = useCallback(async () => {
        setLoading(true);
        try {
            const data = await chatService.listAsAdmin();
            setAdminChats(data);
            setError(null);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [setLoading, setAdminChats, setError]);

    const deleteChat = async (owner: string, id: string) => {
        try {
            await chatService.deleteAsAdmin(owner, id);
            await fetchChats();
            return true;
        } catch (err: any) {
            setError(err.message);
            return false;
        }
    };

    return {
        chats: adminChats,
        isLoading,
        fetchChats,
        deleteChat
    };
}

export function useChat(chatId?: string) {
    const {
        messages,
        isConnected,
        error,
        setMessages,
        setConnected,
        setError
    } = useChatStore();

    const client = getChatClient();

    useEffect(() => {
        setMessages([]);
        setConnected(client.isConnected());

        const unsubConnection = client.onConnection((connected) => {
            setConnected(connected);
            if (connected && chatId) {
                client.switchChat(chatId);
            }
        });

        const unsubError = client.onError((err) => {
            setError(err);
        });

        const unsubMessage = client.onMessage((data) => {
            if (data.type === 'chat_ready') {
                setMessages(data.messages || []);
            } else if (data.type === 'message') {
                const msg = data.message;
                if (!msg.timestamp && !msg.created_at) {
                    msg.timestamp = new Date().toISOString();
                }

                setMessages([...messages, msg]);
            }
        });

        if (chatId && client.isConnected()) {
            client.switchChat(chatId);
        }

        return () => {
            unsubConnection();
            unsubError();
            unsubMessage();
        };
    }, [chatId]);

    const sendMessage = useCallback((content: string, targetId?: string) => {
        client.sendMessage(content, targetId || chatId);
    }, [chatId]);

    return {
        messages,
        isConnected,
        error,
        sendMessage,
    };
}
