import { create } from 'zustand';
import type { Skill } from '../types';

interface SkillsState {
    userSkills: Skill[];
    adminSkills: Skill[];
    selectedSkill: any | null;
    skillVault: Record<string, any> | null;
    isLoading: boolean;
    error: string | null;
    setUserSkills: (skills: Skill[]) => void;
    setAdminSkills: (skills: Skill[]) => void;
    setSelectedSkill: (skill: any | null) => void;
    setSkillVault: (vault: Record<string, any> | null) => void;
    setLoading: (loading: boolean) => void;
    setError: (error: string | null) => void;
}

export const useSkillsStore = create<SkillsState>((set) => ({
    userSkills: [],
    adminSkills: [],
    selectedSkill: null,
    skillVault: null,
    isLoading: false,
    error: null,
    setUserSkills: (userSkills) => set({ userSkills }),
    setAdminSkills: (adminSkills) => set({ adminSkills }),
    setSelectedSkill: (selectedSkill) => set({ selectedSkill }),
    setSkillVault: (skillVault) => set({ skillVault }),
    setLoading: (isLoading) => set({ isLoading }),
    setError: (error) => set({ error }),
}));
