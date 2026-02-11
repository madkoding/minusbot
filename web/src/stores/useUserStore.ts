import { create } from 'zustand';

interface UserState {
    users: any[];
    isLoading: boolean;
    error: string | null;
    setUsers: (users: any[]) => void;
    setLoading: (loading: boolean) => void;
    setError: (error: string | null) => void;
}

export const useUserStore = create<UserState>((set) => ({
    users: [],
    isLoading: false,
    error: null,
    setUsers: (users) => set({ users }),
    setLoading: (isLoading) => set({ isLoading }),
    setError: (error) => set({ error }),
}));
