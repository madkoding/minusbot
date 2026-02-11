import { useCallback } from 'react';
import { vaultService } from '../services/vaultService';
import { useVaultStore } from '../stores/useVaultStore';

export function useVault(apiPath: string) {
    const {
        vaults,
        selectedVault,
        keys,
        isLoading,
        error,
        setVaults,
        setSelectedVault,
        setKeys,
        setLoading,
        setError
    } = useVaultStore();

    const fetchVaults = useCallback(async () => {
        setLoading(true);
        try {
            const data = await vaultService.list(apiPath);
            setVaults(data);
            setError(null);
            return data;
        } catch (err: any) {
            setError(err.message);
            setVaults([]);
            return [];
        } finally {
            setLoading(false);
        }
    }, [apiPath, setLoading, setVaults, setError]);

    const fetchKeys = useCallback(async (id: string) => {
        setLoading(true);
        try {
            const data = await vaultService.getKeys(apiPath, id);
            setKeys(data);
            setSelectedVault(id);
            setError(null);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [apiPath, setLoading, setKeys, setSelectedVault, setError]);

    const updateVaultKey = async (id: string, key: string, value: string) => {
        try {
            await vaultService.updateKey(apiPath, id, key, value);
            await fetchKeys(id);
            return true;
        } catch (err: any) {
            setError(err.message);
            return false;
        }
    };

    const deleteVaultKey = async (id: string, key: string) => {
        try {
            await vaultService.deleteKey(apiPath, id, key);
            await fetchKeys(id);
            return true;
        } catch (err: any) {
            setError(err.message);
            return false;
        }
    };

    return {
        vaults,
        selectedVault,
        keys,
        isLoading,
        error,
        fetchVaults,
        fetchKeys,
        updateVaultKey,
        deleteVaultKey
    };
}
