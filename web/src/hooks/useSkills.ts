import { useCallback } from 'react';
import { skillsService } from '../services/skillsService';
import { useSkillsStore } from '../stores/useSkillsStore';

export function useSkills() {
    const {
        userSkills,
        selectedSkill,
        skillVault,
        isLoading,
        error,
        setUserSkills,
        setSelectedSkill,
        setSkillVault,
        setLoading,
        setError
    } = useSkillsStore();

    const fetchSkills = useCallback(async () => {
        setLoading(true);
        try {
            const data = await skillsService.list();
            setUserSkills(data);
            setError(null);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [setLoading, setUserSkills, setError]);

    const fetchSkillDetail = useCallback(async (id: string) => {
        setLoading(true);
        try {
            const [detail, vault] = await Promise.all([
                skillsService.getDetail(id),
                skillsService.getVault(id)
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
    }, [setLoading, setSelectedSkill, setSkillVault, setError]);

    const fetchConfig = async (id: string) => {
        try {
            return await skillsService.getConfig(id);
        } catch {
            return {};
        }
    };

    const saveConfig = async (id: string, config: any) => {
        try {
            await skillsService.saveConfig(id, config);
            return true;
        } catch (err: any) {
            setError(err.message);
            return false;
        }
    };

    const listDataFiles = async (id: string) => {
        try {
            return await skillsService.listData(id);
        } catch {
            return [];
        }
    };

    const getFileData = async (id: string, filename: string) => {
        try {
            const res = await skillsService.getFile(id, filename);
            return res.content;
        } catch {
            return "";
        }
    };

    const saveFileData = async (id: string, filename: string, content: string) => {
        try {
            await skillsService.saveFile(id, filename, content);
            return true;
        } catch (err: any) {
            setError(err.message);
            return false;
        }
    };

    const listScripts = async (id: string) => {
        try {
            return await skillsService.listScripts(id);
        } catch {
            return [];
        }
    };

    const getScriptContent = async (id: string, filename: string) => {
        try {
            const res = await skillsService.getScript(id, filename);
            return res.content;
        } catch {
            return "";
        }
    };

    const saveScriptContent = async (id: string, filename: string, content: string) => {
        try {
            await skillsService.saveScript(id, filename, content);
            return true;
        } catch (err: any) {
            setError(err.message);
            return false;
        }
    };

    const saveSkill = async (id: string, editData: any) => {
        setLoading(true);
        try {
            await skillsService.save({ id, ...editData });
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
            if (skill.isGlobal) {
                await skillsService.toggle(skill.id);
            } else {
                const newStatus = !skill.enabled;
                const updatedJson = { ...(skill.definition || skill.skillJson), enabled: newStatus };
                await skillsService.save({ id: skill.id, skillJson: updatedJson });
            }
            await fetchSkills();
        } catch (err: any) {
            setError(err.message);
        }
    };

    const deleteSkill = async (id: string) => {
        try {
            await skillsService.delete(id);
            await fetchSkills();
            return true;
        } catch (err: any) {
            setError(err.message);
            return false;
        }
    };

    const updateSkillVault = async (skillId: string, key: string, value: string) => {
        try {
            await skillsService.updateVault(skillId, key, value);
            await fetchSkillDetail(skillId);
            return true;
        } catch (err: any) {
            setError(err.message);
            return false;
        }
    };

    return {
        skills: userSkills,
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

export function useSkillsAsAdmin() {
    const {
        adminSkills,
        selectedSkill,
        skillVault,
        isLoading,
        error,
        setAdminSkills,
        setSelectedSkill,
        setSkillVault,
        setLoading,
        setError
    } = useSkillsStore();

    const fetchSkills = useCallback(async () => {
        setLoading(true);
        try {
            const data = await skillsService.listAsAdmin();
            setAdminSkills(data);
            setError(null);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [setLoading, setAdminSkills, setError]);

    const fetchSkillDetail = useCallback(async (id: string) => {
        setLoading(true);
        try {
            const [detail, vault] = await Promise.all([
                skillsService.getDetailAsAdmin(id),
                skillsService.getVaultAsAdmin(id)
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
    }, [setLoading, setSelectedSkill, setSkillVault, setError]);

    const saveSkill = async (id: string, editData: any) => {
        setLoading(true);
        try {
            await skillsService.saveAsAdmin({ id, ...editData });
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
            await skillsService.toggleAsAdmin(skill.id);
            await fetchSkills();
        } catch (err: any) {
            setError(err.message);
        }
    };

    const deleteSkill = async (id: string) => {
        try {
            await skillsService.deleteAsAdmin(id);
            await fetchSkills();
            return true;
        } catch (err: any) {
            setError(err.message);
            return false;
        }
    };

    const updateSkillVault = async (skillId: string, key: string, value: string) => {
        try {
            await skillsService.updateVaultAsAdmin(skillId, key, value);
            await fetchSkillDetail(skillId);
            return true;
        } catch (err: any) {
            setError(err.message);
            return false;
        }
    };

    return {
        skills: adminSkills,
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
        setSelectedSkill,
        fetchConfig: undefined,
        saveConfig: undefined,
        listDataFiles: undefined,
        getFileData: undefined,
        saveFileData: undefined,
        listScripts: undefined,
        getScriptContent: undefined,
        saveScriptContent: undefined
    };
}
