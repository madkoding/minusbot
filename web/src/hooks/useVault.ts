import { useCallback } from 'react';
import { vaultService } from '../services/vaultService';
import { useVaultStore } from '../stores/useVaultStore';

export function useVault() {
    const {
        userSecrets,
        isLoading,
        error,
        setUserSecrets,
        setLoading,
        setError
    } = useVaultStore();

    const fetchSecrets = useCallback(async () => {
        setLoading(true);
        try {
            const data = await vaultService.list();
            setUserSecrets(data);
            setError(null);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [setLoading, setUserSecrets, setError]);

    const getKeys = async (id: string) => {
        try {
            return await vaultService.getKeys(id);
        } catch (err: any) {
            setError(err.message);
            return {};
        }
    };

    const updateKey = async (id: string, key: string, value: string) => {
        try {
            await vaultService.updateKey(id, key, value);
            await fetchSecrets();
            return true;
        } catch (err: any) {
            setError(err.message);
            return false;
        }
    };

    const deleteKey = async (id: string, key: string) => {
        try {
            await vaultService.deleteKey(id, key);
            await fetchSecrets();
            return true;
        } catch (err: any) {
            setError(err.message);
            return false;
        }
    };

    return {
        secrets: userSecrets,
        isLoading,
        error,
        fetchSecrets,
        getKeys,
        updateKey,
        deleteKey
    };
}

export function useVaultAsAdmin() {
    const {
        adminSecrets,
        isLoading,
        error,
        setAdminSecrets,
        setLoading,
        setError
    } = useVaultStore();

    const fetchSecrets = useCallback(async () => {
        setLoading(true);
        try {
            const data = await vaultService.listAsAdmin();
            setAdminSecrets(data);
            setError(null);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [setLoading, setAdminSecrets, setError]);

    const getKeys = async (id: string) => {
        try {
            return await vaultService.getKeysAsAdmin(id);
        } catch (err: any) {
            setError(err.message);
            return {};
        }
    };

    const updateKey = async (id: string, key: string, value: string) => {
        try {
            await vaultService.updateKeyAsAdmin(id, key, value);
            await fetchSecrets();
            return true;
        } catch (err: any) {
            setError(err.message);
            return false;
        }
    };

    const deleteKey = async (id: string, key: string) => {
        try {
            await vaultService.deleteKeyAsAdmin(id, key);
            await fetchSecrets();
            return true;
        } catch (err: any) {
            setError(err.message);
            return false;
        }
    };

    return {
        secrets: adminSecrets,
        isLoading,
        error,
        fetchSecrets,
        getKeys,
        updateKey,
        deleteKey
    };
}
