import { useCallback } from 'react';
import { chatService } from '../services/chatService';
import { useChatStore } from '../stores/useChatStore';

export function useAdminChats() {
    const {
        adminChats,
        isLoading,
        setAdminChats,
        setLoading,
        setError
    } = useChatStore();

    const fetchAdminChats = useCallback(async () => {
        setLoading(true);
        try {
            const data = await chatService.adminList();
            setAdminChats(data);
            setError(null);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [setLoading, setAdminChats, setError]);

    const deleteChat = async (owner: string, id: string) => {
        try {
            await chatService.delete(owner, id);
            await fetchAdminChats();
            return true;
        } catch (err: any) {
            setError(err.message);
            return false;
        }
    };

    return {
        adminChats,
        isLoading,
        fetchAdminChats,
        deleteChat
    };
}
