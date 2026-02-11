import { useCallback } from 'react';
import { channelsService } from '../services/channelsService';
import { useChannelsStore } from '../stores/useChannelsStore';

export function useChannels(apiPath: string) {
    const {
        channels,
        selectedChannel,
        isLoading,
        error,
        setChannels,
        setSelectedChannel,
        setLoading,
        setError
    } = useChannelsStore();

    const fetchChannels = useCallback(async () => {
        setLoading(true);
        try {
            const data = await channelsService.list(apiPath);
            setChannels(data);
            setError(null);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [apiPath, setLoading, setChannels, setError]);

    const fetchChannelConfig = useCallback(async (id: string, isAdmin: boolean) => {
        setLoading(true);
        try {
            const data = await channelsService.getConfig(apiPath, id, isAdmin);
            if (isAdmin) {
                const schema = channels?.find(c => c.id === id);
                setSelectedChannel({ schema, secrets: data || {} });
            } else {
                setSelectedChannel(data);
            }
            setError(null);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [apiPath, channels, setLoading, setSelectedChannel, setError]);

    const saveChannel = async (id: string, data: any, isAdmin: boolean) => {
        setLoading(true);
        try {
            await channelsService.save(apiPath, id, data, isAdmin);
            await fetchChannels();
            setError(null);
            return true;
        } catch (err: any) {
            setError(err.response?.data?.error || err.message);
            return false;
        } finally {
            setLoading(false);
        }
    };

    const deleteChannel = async (id: string) => {
        try {
            await channelsService.delete(apiPath, id);
            await fetchChannels();
            return true;
        } catch (err: any) {
            setError(err.message);
            return false;
        }
    };

    return {
        channels,
        selectedChannel,
        isLoading,
        error,
        fetchChannels,
        fetchChannelConfig,
        saveChannel,
        deleteChannel,
        setSelectedChannel
    };
}
