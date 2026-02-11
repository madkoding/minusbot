import { create } from 'zustand';

interface SkillsState {
    skills: any[];
    selectedSkill: any | null;
    skillVault: Record<string, boolean>;
    isLoading: boolean;
    error: string | null;
    setSkills: (skills: any[]) => void;
    setSelectedSkill: (skill: any | null) => void;
    setSkillVault: (vault: Record<string, boolean>) => void;
    setLoading: (loading: boolean) => void;
    setError: (error: string | null) => void;
}

export const useSkillsStore = create<SkillsState>((set) => ({
    skills: [],
    selectedSkill: null,
    skillVault: {},
    isLoading: false,
    error: null,
    setSkills: (skills) => set({ skills }),
    setSelectedSkill: (selectedSkill) => set({ selectedSkill }),
    setSkillVault: (skillVault) => set({ skillVault }),
    setLoading: (isLoading) => set({ isLoading }),
    setError: (error) => set({ error }),
}));
