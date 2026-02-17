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
            return detail;
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [apiPath, setLoading, setSelectedSkill, setSkillVault, setError]);

    const fetchConfig = async (id: string) => {
        try {
            return await skillsService.getConfig(apiPath, id);
        } catch {
            return {};
        }
    };

    const saveConfig = async (id: string, config: any) => {
        try {
            await skillsService.saveConfig(apiPath, id, config);
            return true;
        } catch (err: any) {
            setError(err.message);
            return false;
        }
    };

    const listDataFiles = async (id: string) => {
        try {
            return await skillsService.listData(apiPath, id);
        } catch {
            return [];
        }
    };

    const getFileData = async (id: string, filename: string) => {
        try {
            const res = await skillsService.getFile(apiPath, id, filename);
            return res.content;
        } catch {
            return "";
        }
    };

    const saveFileData = async (id: string, filename: string, content: string) => {
        try {
            await skillsService.saveFile(apiPath, id, filename, content);
            return true;
        } catch (err: any) {
            setError(err.message);
            return false;
        }
    };

    const listScripts = async (id: string) => {
        try {
            return await skillsService.listScripts(apiPath, id);
        } catch {
            return [];
        }
    };

    const getScriptContent = async (id: string, filename: string) => {
        try {
            const res = await skillsService.getScript(apiPath, id, filename);
            return res.content;
        } catch {
            return "";
        }
    };

    const saveScriptContent = async (id: string, filename: string, content: string) => {
        try {
            await skillsService.saveScript(apiPath, id, filename, content);
            return true;
        } catch (err: any) {
            setError(err.message);
            return false;
        }
    };

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
        fetchConfig,
        saveConfig,
        listDataFiles,
        getFileData,
        saveFileData,
        listScripts,
        getScriptContent,
        saveScriptContent,
        saveSkill,
        toggleSkillStatus,
        deleteSkill,
        updateSkillVault,
        setSelectedSkill
    };
}
