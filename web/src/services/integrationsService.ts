import { apiClient } from "../lib/apiClient";

export const integrationsService = {
    list: async (path: string) => {
        const res = await apiClient.get(path);
        return res.data;
    },
    saveSettings: async (path: string, id: string, data: any, isAdmin: boolean) => {
        if (isAdmin) {
            return await apiClient.put(`${path}/${id}`, data);
        } else {
            return await apiClient.post(`${path}/${id}`, data);
        }
    },
    saveSecrets: async (path: string, id: string, secrets: any, isAdmin: boolean, schema: any) => {
        if (isAdmin) {
            return await apiClient.put(`${path}/${id}/vault`, { secrets });
        } else {
            const vaultId = schema.vaultId || `integration-${id}`;
            for (const [key, value] of Object.entries(secrets)) {
                if (value && typeof value === 'string' && value.trim()) {
                    await apiClient.put(`/user/vault/${vaultId}`, { key, value });
                }
            }
        }
    },
    delete: async (path: string, id: string) => {
        return await apiClient.delete(`${path}/${id}`);
    }
};
