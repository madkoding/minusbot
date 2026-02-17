import { useCallback } from 'react';
import { userService } from '../services/userService';
import { useUserStore } from '../stores/useUserStore';
import { useAuthStore } from '../stores/useAuthStore';

export function useUser() {
    const { user, setUser } = useAuthStore();

    const fetchMe = useCallback(async () => {
        try {
            const data = await userService.getMe();
            setUser(data);
        } catch (err: any) {
            console.error("Failed to fetch user data", err);
        }
    }, [setUser]);

    return {
        user,
        fetchMe
    };
}

export function useUsersAsAdmin() {
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
            const data = await userService.listAsAdmin();
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
            await userService.createAsAdmin(data);
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
            await userService.deleteAsAdmin(id);
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
