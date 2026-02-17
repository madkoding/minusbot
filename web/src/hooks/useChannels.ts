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
        setLoading(true);
        try {
            const data = isAdmin ? await channelsService.listAsAdmin() : await channelsService.list();
            const channel = data.find((c: any) => c.id === id);
            setSelectedChannel(channel);
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
            const data = await channelsService.listAsAdmin();
            const channel = data.find((c: any) => c.id === id);
            setSelectedChannel(channel);
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
            await channelsService.saveAsAdmin(id, data);
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
