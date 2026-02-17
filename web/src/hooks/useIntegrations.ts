import { useCallback } from 'react';
import { integrationsService } from '../services/integrationsService';
import { useIntegrationsStore } from '../stores/useIntegrationsStore';

export function useIntegrations() {
    const {
        userIntegrations,
        selectedIntegration,
        isLoading,
        error,
        setUserIntegrations,
        setSelectedIntegration,
        setLoading,
        setError
    } = useIntegrationsStore();

    const fetchIntegrations = useCallback(async () => {
        setLoading(true);
        try {
            const data = await integrationsService.list();
            setUserIntegrations(data);
            setError(null);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [setLoading, setUserIntegrations, setError]);

    const fetchIntegrationConfig = async (id: string, isAdmin: boolean) => {
        const currentList = isAdmin ? useIntegrationsStore.getState().adminIntegrations : useIntegrationsStore.getState().userIntegrations;
        const existing = currentList?.available?.find((i: any) => i.id === id);

        if (existing) {
            setSelectedIntegration(existing);
            return;
        }

        setLoading(true);
        try {
            const data = isAdmin ? await integrationsService.listAsAdmin() : await integrationsService.list();
            const integration = data.available.find((i: any) => i.id === id);
            setSelectedIntegration(integration);
        } finally {
            setLoading(false);
        }
    };

    const saveSettings = async (id: string, data: any) => {
        try {
            await integrationsService.saveSettings(id, data);
            await fetchIntegrations();
            return true;
        } catch (err: any) {
            setError(err.message);
            return false;
        }
    };

    const saveSecrets = async (id: string, secrets: any, schema: any) => {
        try {
            await integrationsService.saveSecrets(id, secrets, schema);
            return true;
        } catch (err: any) {
            setError(err.message);
            return false;
        }
    };

    const deleteIntegration = async (id: string) => {
        try {
            await integrationsService.delete(id);
            await fetchIntegrations();
            return true;
        } catch (err: any) {
            setError(err.message);
            return false;
        }
    };

    return {
        integrations: userIntegrations,
        selectedIntegration,
        isLoading,
        error,
        fetchIntegrations,
        fetchIntegrationConfig,
        saveSettings,
        saveSecrets,
        deleteIntegration,
        setSelectedIntegration
    };
}

export function useIntegrationsAsAdmin() {
    const {
        adminIntegrations,
        selectedIntegration,
        isLoading,
        error,
        setAdminIntegrations,
        setSelectedIntegration,
        setLoading,
        setError
    } = useIntegrationsStore();

    const fetchIntegrations = useCallback(async () => {
        setLoading(true);
        try {
            const data = await integrationsService.listAsAdmin();
            setAdminIntegrations(data);
            setError(null);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [setLoading, setAdminIntegrations, setError]);

    const fetchIntegrationConfig = async (id: string) => {
        const existing = useIntegrationsStore.getState().adminIntegrations?.available?.find((i: any) => i.id === id);
        if (existing) {
            setSelectedIntegration(existing);
            return;
        }

        setLoading(true);
        try {
            const data = await integrationsService.listAsAdmin();
            const integration = data.available.find((i: any) => i.id === id);
            setSelectedIntegration(integration);
        } finally {
            setLoading(false);
        }
    };

    const saveSettings = async (id: string, data: any) => {
        try {
            await integrationsService.saveSettingsAsAdmin(id, data);
            await fetchIntegrations();
            return true;
        } catch (err: any) {
            setError(err.message);
            return false;
        }
    };

    const saveSecrets = async (id: string, secrets: any) => {
        try {
            await integrationsService.saveSecretsAsAdmin(id, secrets);
            return true;
        } catch (err: any) {
            setError(err.message);
            return false;
        }
    };

    const deleteIntegration = async (id: string) => {
        try {
            await integrationsService.deleteAsAdmin(id);
            await fetchIntegrations();
            return true;
        } catch (err: any) {
            setError(err.message);
            return false;
        }
    };

    return {
        integrations: adminIntegrations,
        selectedIntegration,
        isLoading,
        error,
        fetchIntegrations,
        fetchIntegrationConfig,
        saveSettings,
        saveSecrets,
        deleteIntegration,
        setSelectedIntegration
    };
}
