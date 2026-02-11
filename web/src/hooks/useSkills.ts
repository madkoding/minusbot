import { useCallback } from 'react';
import { skillsService } from '../services/skillsService';
import { useSkillsStore } from '../stores/useSkillsStore';

export function useSkills(apiPath: string) {
    const {
        skills,
        selectedSkill,
        skillVault,
        isLoading,
        error,
        setSkills,
        setSelectedSkill,
        setSkillVault,
        setLoading,
        setError
    } = useSkillsStore();

    const fetchSkills = useCallback(async () => {
        setLoading(true);
        try {
            const data = await skillsService.list(apiPath);
            setSkills(data);
            setError(null);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [apiPath, setLoading, setSkills, setError]);

    const fetchSkillDetail = useCallback(async (id: string) => {
        setLoading(true);
        try {
            const [detail, vault] = await Promise.all([
                skillsService.getDetail(apiPath, id),
                skillsService.getVault(apiPath, id)
            ]);
            setSelectedSkill(detail);
            setSkillVault(vault);
            setError(null);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [apiPath, setLoading, setSelectedSkill, setSkillVault, setError]);

    const saveSkill = async (id: string, editData: any) => {
        setLoading(true);
        try {
            await skillsService.save(apiPath, { id, ...editData });
            await fetchSkills();
            setError(null);
            return true;
        } catch (err: any) {
            setError(err.message);
            return false;
        } finally {
            setLoading(false);
        }
    };

    const toggleSkillStatus = async (skill: any) => {
        try {
            if (apiPath.includes('admin')) {
                await skillsService.toggleAdmin(skill.id);
            } else if (skill.isGlobal) {
                await skillsService.toggleUserGlobal(skill.id);
            } else {
                const newStatus = !skill.enabled;
                const updatedJson = { ...(skill.definition || skill.skillJson), enabled: newStatus };
                await skillsService.save(apiPath, { id: skill.id, skillJson: updatedJson });
            }
            await fetchSkills();
        } catch (err: any) {
            setError(err.message);
        }
    };

    const deleteSkill = async (id: string) => {
        try {
            await skillsService.delete(apiPath, id);
            await fetchSkills();
            return true;
        } catch (err: any) {
            setError(err.message);
            return false;
        }
    };

    const updateSkillVault = async (skillId: string, key: string, value: string) => {
        try {
            await skillsService.updateVault(apiPath, skillId, key, value);
            await fetchSkillDetail(skillId);
            return true;
        } catch (err: any) {
            setError(err.message);
            return false;
        }
    };

    return {
        skills,
        selectedSkill,
        skillVault,
        isLoading,
        error,
        fetchSkills,
        fetchSkillDetail,
        saveSkill,
        toggleSkillStatus,
        deleteSkill,
        updateSkillVault,
        setSelectedSkill
    };
}
