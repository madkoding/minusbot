import { useCallback } from 'react';
import { toolsService } from '../services/toolsService';
import { useToolsStore } from '../stores/useToolsStore';

export function useTools() {
    const {
        allTools,
        userDisabledTools,
        isLoading,
        error,
        setAllTools,
        setUserDisabledTools,
        setLoading,
        setError
    } = useToolsStore();

    const fetchTools = useCallback(async () => {
        setLoading(true);
        try {
            const [all, disabled] = await Promise.all([
                toolsService.listAllAsAdmin(),
                toolsService.getDisabled()
            ]);
            setAllTools(all);
            setUserDisabledTools(disabled);
            setError(null);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [setLoading, setAllTools, setUserDisabledTools, setError]);

    const toggleTool = async (name: string) => {
        try {
            await toolsService.toggle(name);
            await fetchTools();
            return true;
        } catch (err: any) {
            setError(err.message);
            return false;
        }
    };

    return {
        allTools,
        disabledTools: userDisabledTools,
        isLoading,
        error,
        fetchTools,
        toggleTool
    };
}

export function useToolsAsAdmin() {
    const {
        allTools,
        adminDisabledTools,
        isLoading,
        error,
        setAllTools,
        setAdminDisabledTools,
        setLoading,
        setError
    } = useToolsStore();

    const fetchTools = useCallback(async () => {
        setLoading(true);
        try {
            const [all, disabled] = await Promise.all([
                toolsService.listAllAsAdmin(),
                toolsService.getDisabledAsAdmin()
            ]);
            setAllTools(all);
            setAdminDisabledTools(disabled);
            setError(null);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [setLoading, setAllTools, setAdminDisabledTools, setError]);

    const toggleTool = async (name: string) => {
        try {
            await toolsService.toggleAsAdmin(name);
            await fetchTools();
            return true;
        } catch (err: any) {
            setError(err.message);
            return false;
        }
    };

    return {
        allTools,
        disabledTools: adminDisabledTools,
        isLoading,
        error,
        fetchTools,
        toggleTool
    };
}
