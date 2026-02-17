import { create } from 'zustand';

interface ChatState {
    userChats: any[];
    adminChats: any[];
    messages: any[];
    isConnected: boolean;
    isLoading: boolean;
    error: string | null;
    setUserChats: (chats: any[]) => void;
    setAdminChats: (chats: any[]) => void;
    setMessages: (messages: any[] | ((prev: any[]) => any[])) => void;
    setConnected: (connected: boolean) => void;
    setLoading: (loading: boolean) => void;
    setError: (error: string | null) => void;
}

export const useChatStore = create<ChatState>((set) => ({
    userChats: [],
    adminChats: [],
    messages: [],
    isConnected: false,
    isLoading: false,
    error: null,
    setUserChats: (userChats) => set({ userChats }),
    setAdminChats: (adminChats) => set({ adminChats }),
    setMessages: (messages) => set((state) => ({
        messages: typeof messages === 'function' ? (messages as any)(state.messages) : messages
    })),
    setConnected: (isConnected) => set({ isConnected }),
    setLoading: (isLoading) => set({ isLoading }),
    setError: (error) => set({ error }),
}));
