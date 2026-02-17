import { useCallback } from 'react';
import { channelsService } from '../services/channelsService';
import { useChannelsStore } from '../stores/useChannelsStore';

export function useChannels() {
    const {
        userChannels,
        selectedChannel,
        isLoading,
        error,
        setUserChannels,
        setSelectedChannel,
        setLoading,
        setError
    } = useChannelsStore();

    const fetchChannels = useCallback(async () => {
        setLoading(true);
        try {
            const data = await channelsService.list();
            setUserChannels(Array.isArray(data) ? data : []);
            setError(null);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [setLoading, setUserChannels, setError]);

    const fetchChannelConfig = async (id: string, isAdmin: boolean) => {
        // Even if we have it in the list, we want the full config (settings, schema, etc)
        // or at least we want to ensure the structure matches what the view expects.

        setLoading(true);
        try {
            // Admin list doesn't have a detail endpoint yet, but user does.
            if (isAdmin) {
                const data = await channelsService.listAsAdmin();
                const channel = Array.isArray(data) ? data.find((c: any) => c.id === id) : null;
                setSelectedChannel(channel);
            } else {
                const data = await channelsService.get(id);
                setSelectedChannel(data);
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const toggleChannel = async (id: string) => {
        try {
            await channelsService.toggle(id);
            await fetchChannels();
            return true;
        } catch (err: any) {
            setError(err.message);
            return false;
        }
    };

    const saveChannel = async (id: string, data: any) => {
        try {
            await channelsService.save(id, data);
            await fetchChannels();
            return true;
        } catch (err: any) {
            setError(err.message);
            return false;
        }
    };

    return {
        channels: userChannels,
        selectedChannel,
        isLoading,
        error,
        fetchChannels,
        fetchChannelConfig,
        toggleChannel,
        saveChannel,
        setSelectedChannel
    };
}

export function useChannelsAsAdmin() {
    const {
        adminChannels,
        selectedChannel,
        isLoading,
        error,
        setAdminChannels,
        setSelectedChannel,
        setLoading,
        setError
    } = useChannelsStore();

    const fetchChannels = useCallback(async () => {
        setLoading(true);
        try {
            const data = await channelsService.listAsAdmin();
            setAdminChannels(Array.isArray(data) ? data : []);
            setError(null);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [setLoading, setAdminChannels, setError]);

    const fetchChannelConfig = async (id: string) => {
        setLoading(true);
        try {
            const channels = await channelsService.listAsAdmin();
            const channel = channels.find((c: any) => c.id === id);

            if (channel) {
                const vault = await channelsService.getVault(id);
                setSelectedChannel({
                    ...channel,
                    secrets: vault,
                    schema: channel // For consistency with user view
                });
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const toggleChannel = async (id: string) => {
        try {
            await channelsService.toggleAsAdmin(id);
            await fetchChannels();
            return true;
        } catch (err: any) {
            setError(err.message);
            return false;
        }
    };

    const saveChannel = async (id: string, data: any) => {
        try {
            if (data.secrets) {
                await channelsService.saveVault(id, data.secrets);
            }
            await fetchChannels();
            return true;
        } catch (err: any) {
            setError(err.message);
            return false;
        }
    };

    return {
        channels: adminChannels,
        selectedChannel,
        isLoading,
        error,
        fetchChannels,
        fetchChannelConfig,
        toggleChannel,
        saveChannel,
        setSelectedChannel
    };
}
