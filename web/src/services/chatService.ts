import { apiClient } from "../lib/apiClient";

export const chatService = {
    list: async () => {
        const res = await apiClient.get('/user/chat');
        return Array.isArray(res.data) ? res.data : [];
    },
    adminList: async () => {
        const res = await apiClient.get('/admin/chat');
        return Array.isArray(res.data) ? res.data : [];
    },
    delete: async (owner: string, id: string) => {
        return await apiClient.delete(`/admin/chat/${owner}/${id}`);
    }
};
