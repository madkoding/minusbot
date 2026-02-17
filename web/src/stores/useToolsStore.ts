import { create } from 'zustand';
import type { Tool } from '../types';

interface ToolsState {
    allTools: Tool[];
    userDisabledTools: string[];
    adminDisabledTools: string[];
    isLoading: boolean;
    error: string | null;
    setAllTools: (tools: Tool[]) => void;
    setUserDisabledTools: (disabledTools: string[]) => void;
    setAdminDisabledTools: (disabledTools: string[]) => void;
    setLoading: (loading: boolean) => void;
    setError: (error: string | null) => void;
}

export const useToolsStore = create<ToolsState>((set) => ({
    allTools: [],
    userDisabledTools: [],
    adminDisabledTools: [],
    isLoading: false,
    error: null,
    setAllTools: (allTools) => set({ allTools }),
    setUserDisabledTools: (userDisabledTools) => set({ userDisabledTools }),
    setAdminDisabledTools: (adminDisabledTools) => set({ adminDisabledTools }),
    setLoading: (isLoading) => set({ isLoading }),
    setError: (error) => set({ error }),
}));
