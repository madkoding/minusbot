import { useCallback } from 'react';
import { toolsService } from '../services/toolsService';
import { useToolsStore } from '../stores/useToolsStore';

export function useTools(apiPath: string) {
    const {
        allTools,
        disabledTools,
        isLoading,
        error,
        setAllTools,
        setDisabledTools,
        setLoading,
        setError
    } = useToolsStore();

    const fetchTools = useCallback(async () => {
        setLoading(true);
        try {
            const [all, disabled] = await Promise.all([
                toolsService.listAll(),
                toolsService.getDisabled(apiPath)
            ]);
            setAllTools(all);
            setDisabledTools(disabled);
            setError(null);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [apiPath, setLoading, setAllTools, setDisabledTools, setError]);

    const toggleTool = async (name: string) => {
        try {
            await toolsService.toggle(apiPath, name);
            await fetchTools();
            return true;
        } catch (err: any) {
            setError(err.message);
            return false;
        }
    };

    return {
        allTools,
        disabledTools,
        isLoading,
        error,
        fetchTools,
        toggleTool
    };
}
