import { create } from 'zustand';

interface ToolsState {
    allTools: any[];
    disabledTools: string[];
    isLoading: boolean;
    error: string | null;
    setAllTools: (tools: any[]) => void;
    setDisabledTools: (disabled: string[]) => void;
    setLoading: (loading: boolean) => void;
    setError: (error: string | null) => void;
}

export const useToolsStore = create<ToolsState>((set) => ({
    allTools: [],
    disabledTools: [],
    isLoading: false,
    error: null,
    setAllTools: (allTools) => set({ allTools }),
    setDisabledTools: (disabledTools) => set({ disabledTools }),
    setLoading: (isLoading) => set({ isLoading }),
    setError: (error) => set({ error }),
}));
