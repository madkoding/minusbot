import { useCallback } from 'react';
import { providersService } from '../services/providersService';
import { useProvidersStore } from '../stores/useProvidersStore';

export function useProviders() {
    const {
        userProviders,
        clients,
        isLoading,
        error,
        setUserProviders,
        setClients,
        setLoading,
        setError
    } = useProvidersStore();

    const fetchProviders = useCallback(async () => {
        setLoading(true);
        try {
            const [providers, clients] = await Promise.all([
                providersService.list(),
                providersService.listClients()
            ]);
            setUserProviders(providers);
            setClients(clients);
            setError(null);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [setLoading, setUserProviders, setClients, setError]);

    const saveProvider = async (provider: any) => {
        try {
            const data = await providersService.save(provider);
            await fetchProviders();
            return data;
        } catch (err: any) {
            setError(err.message);
            return null;
        }
    };

    const deleteProvider = async (id: string) => {
        try {
            await providersService.delete(id);
            await fetchProviders();
            return true;
        } catch (err: any) {
            setError(err.message);
            return false;
        }
    };

    const activateProvider = async (id: string | null, type: string, isGlobal?: boolean) => {
        try {
            await providersService.activate(id, type, isGlobal);
            await fetchProviders();
            return true;
        } catch (err: any) {
            setError(err.message);
            return false;
        }
    };

    const listModels = async (id: string) => {
        return await providersService.listModels(id);
    };

    const listModelsByConfig = async (config: any) => {
        return await providersService.listModelsByConfig(config);
    };

    return {
        providers: userProviders,
        clients,
        isLoading,
        error,
        fetchProviders,
        saveProvider,
        deleteProvider,
        activateProvider,
        listModels,
        listModelsByConfig
    };
}

export function useProvidersAsAdmin() {
    const {
        adminProviders,
        clients,
        isLoading,
        error,
        setAdminProviders,
        setClients,
        setLoading,
        setError
    } = useProvidersStore();

    const fetchProviders = useCallback(async () => {
        setLoading(true);
        try {
            const [providers, clients] = await Promise.all([
                providersService.listAsAdmin(),
                providersService.listClientsAsAdmin()
            ]);
            setAdminProviders(providers);
            setClients(clients);
            setError(null);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [setLoading, setAdminProviders, setClients, setError]);

    const saveProvider = async (provider: any) => {
        try {
            const data = await providersService.saveAsAdmin(provider);
            await fetchProviders();
            return data;
        } catch (err: any) {
            setError(err.message);
            return null;
        }
    };

    const deleteProvider = async (id: string) => {
        try {
            await providersService.deleteAsAdmin(id);
            await fetchProviders();
            return true;
        } catch (err: any) {
            setError(err.message);
            return false;
        }
    };

    const activateProvider = async (id: string | null, type: string) => {
        try {
            await providersService.activateAsAdmin(id, type);
            await fetchProviders();
            return true;
        } catch (err: any) {
            setError(err.message);
            return false;
        }
    };

    const listModels = async (id: string) => {
        return await providersService.listModelsAsAdmin(id);
    };

    const listModelsByConfig = async (config: any) => {
        return await providersService.listModelsByConfigAsAdmin(config);
    };

    return {
        providers: adminProviders,
        clients,
        isLoading,
        error,
        fetchProviders,
        saveProvider,
        deleteProvider,
        activateProvider,
        listModels,
        listModelsByConfig
    };
}
