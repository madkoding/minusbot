import { apiClient } from "../lib/apiClient";
import type { ChatMeta } from "../types";

export const chatService = {
    list: async (): Promise<ChatMeta[]> => {
        const res = await apiClient.get('/user/chat');
        return Array.isArray(res.data) ? res.data : [];
    },

    listAsAdmin: async (): Promise<ChatMeta[]> => {
        const res = await apiClient.get('/admin/chat');
        return Array.isArray(res.data) ? res.data : [];
    },

    deleteAsAdmin: async (owner: string, id: string): Promise<any> => {
        return await apiClient.delete(`/admin/chat/${owner}/${id}`);
    }
};
