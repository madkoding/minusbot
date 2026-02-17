import { create } from 'zustand';
import type { Stat } from '../types';

interface StatsState {
    userStats: Stat | null;
    adminStats: Stat | null;
    isLoading: boolean;
    error: string | null;
    setUserStats: (stats: Stat | null) => void;
    setAdminStats: (stats: Stat | null) => void;
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
