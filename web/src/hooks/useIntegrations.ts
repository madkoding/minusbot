import { useCallback } from 'react';
import { integrationsService } from '../services/integrationsService';
import { useIntegrationsStore } from '../stores/useIntegrationsStore';

export function useIntegrations(apiPath: string) {
    const {
        available,
        configs,
        isLoading,
        error,
        setData,
        setLoading,
        setError
    } = useIntegrationsStore();

    const fetchIntegrations = useCallback(async () => {
        setLoading(true);
        try {
            const res = await integrationsService.list(apiPath);
            setData(res.data);
            setError(null);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [apiPath, setLoading, setData, setError]);

    const saveSettings = async (id: string, data: any, isAdmin: boolean) => {
        setLoading(true);
        try {
            await integrationsService.saveSettings(apiPath, id, data, isAdmin);
            await fetchIntegrations();
            return true;
        } catch (err: any) {
            setError(err.message);
            return false;
        } finally {
            setLoading(false);
        }
    };

    const saveSecrets = async (id: string, secrets: any, isAdmin: boolean, schema: any) => {
        setLoading(true);
        try {
            await integrationsService.saveSecrets(apiPath, id, secrets, isAdmin, schema);
            return true;
        } catch (err: any) {
            setError(err.message);
            return false;
        } finally {
            setLoading(false);
        }
    };

    const deleteIntegration = async (id: string) => {
        try {
            await integrationsService.delete(apiPath, id);
            await fetchIntegrations();
            return true;
        } catch (err: any) {
            setError(err.message);
            return false;
        }
    };

    return {
        available,
        configs,
        isLoading,
        error,
        fetchIntegrations,
        saveSettings,
        saveSecrets,
        deleteIntegration
    };
}
