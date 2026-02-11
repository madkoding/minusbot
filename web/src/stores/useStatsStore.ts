import { create } from 'zustand';

interface StatsState {
    userStats: any | null;
    adminStats: any | null;
    isLoading: boolean;
    error: string | null;
    setUserStats: (stats: any) => void;
    setAdminStats: (stats: any) => void;
    setLoading: (loading: boolean) => void;
    setError: (error: string | null) => void;
}

export const useStatsStore = create<StatsState>((set) => ({
    userStats: null,
    adminStats: null,
    isLoading: false,
    error: null,
    setUserStats: (userStats) => set({ userStats }),
    setAdminStats: (adminStats) => set({ adminStats }),
    setLoading: (isLoading) => set({ isLoading }),
    setError: (error) => set({ error }),
}));
