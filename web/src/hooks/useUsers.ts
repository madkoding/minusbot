import { useCallback } from 'react';
import { userService } from '../services/userService';
import { useUserStore } from '../stores/useUserStore';

export function useUsers() {
    const {
        users,
        isLoading,
        error,
        setUsers,
        setLoading,
        setError
    } = useUserStore();

    const fetchUsers = useCallback(async () => {
        setLoading(true);
        try {
            const data = await userService.list();
            setUsers(Array.isArray(data) ? data : []);
            setError(null);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [setLoading, setUsers, setError]);

    const createUser = async (data: any) => {
        setLoading(true);
        try {
            await userService.create(data);
            await fetchUsers();
            return true;
        } catch (err: any) {
            setError(err.response?.data || err.message);
            return false;
        } finally {
            setLoading(false);
        }
    };

    const deleteUser = async (id: string) => {
        try {
            await userService.delete(id);
            await fetchUsers();
            return true;
        } catch (err: any) {
            setError(err.message);
            return false;
        }
    };

    return {
        users,
        isLoading,
        error,
        fetchUsers,
        createUser,
        deleteUser
    };
}
