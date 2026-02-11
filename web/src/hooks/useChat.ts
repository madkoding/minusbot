import { useRef, useCallback, useEffect } from 'react';
import { getWSUrl } from '../lib/apiClient';
import { useChatStore } from '../stores/useChatStore';

export function useChat(chatId?: string) {
    const {
        messages,
        isConnected,
        setMessages,
        setConnected
    } = useChatStore();

    const socketRef = useRef<WebSocket | null>(null);

    const connect = useCallback(() => {
        const socket = new WebSocket(getWSUrl());
        socketRef.current = socket;

        socket.onopen = () => {
            const token = localStorage.getItem('token');
            socket.send(JSON.stringify({ type: 'auth', token }));
            setConnected(true);

            if (chatId) {
                socket.send(JSON.stringify({ type: 'init_chat', chatId }));
            }
        };

        socket.onmessage = (e) => {
            const msg = JSON.parse(e.data);
            if (msg.type === 'chat_ready') {
                setMessages(msg.messages || []);
            } else if (msg.type === 'message') {
                // Use functional update provided by Zustand's setter if we manually wrap or just use the local setter from store
                setMessages([...useChatStore.getState().messages, msg.message]);
            }
        };

        socket.onclose = () => {
            setConnected(false);
        };

        return () => {
            socket.close();
        };
    }, [chatId, messages, setMessages, setConnected]);

    useEffect(() => {
        const cleanup = connect();
        return cleanup;
    }, [connect]);

    const sendMessage = (content: string) => {
        if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) return;
        socketRef.current.send(JSON.stringify({ type: 'message', content }));
    };

    return {
        messages,
        isConnected,
        sendMessage,
    };
}
