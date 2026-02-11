import { apiClient } from "../lib/apiClient";

export const toolsService = {
    listAll: async () => {
        const res = await apiClient.get('/admin/tools');
        return res.data;
    },
    getDisabled: async (path: string) => {
        const res = await apiClient.get(path);
        return res.data.disabled_tools || [];
    },
    toggle: async (path: string, name: string) => {
        if (path.includes('admin')) {
            return await apiClient.post('/admin/settings/toggle-global-tool', { name });
        } else {
            return await apiClient.post('/user/settings/toggle-tool', { name });
        }
    }
};
