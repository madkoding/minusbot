import { apiClient } from "../lib/apiClient";
import type { Integration, IntegrationsResponse } from "../types";

export const integrationsService = {
    list: async (): Promise<IntegrationsResponse> => {
        const res = await apiClient.get('/user/integrations');
        // Handle both wrapped and unwrapped response
        return res.data.data || res.data;
    },

    listAsAdmin: async (): Promise<IntegrationsResponse> => {
        const res = await apiClient.get('/admin/integrations');
        return res.data.data || res.data;
    },

    saveSettings: async (id: string, data: any): Promise<void> => {
        await apiClient.put(`/user/integrations/${id}`, data);
    },

    saveSettingsAsAdmin: async (id: string, data: any): Promise<void> => {
        await apiClient.put(`/admin/integrations/${id}`, data);
    },

    saveSecrets: async (id: string, secrets: any, schema: any): Promise<void> => {
        const vaultId = schema.vaultId || `integration-${id}`;
        await apiClient.put(`/user/vault/${vaultId}`, secrets);
    },

    saveSecretsAsAdmin: async (id: string, secrets: any): Promise<void> => {
        await apiClient.put(`/admin/integrations/${id}/vault`, { secrets });
    },

    delete: async (id: string): Promise<void> => {
        await apiClient.delete(`/user/integrations/${id}`);
    },

    deleteAsAdmin: async (id: string): Promise<void> => {
        await apiClient.delete(`/admin/integrations/${id}`);
    }
};
