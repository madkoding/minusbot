import { create } from 'zustand';
import type { ChannelStatus } from '@shared/types';

interface ChannelsState {
    userChannels: ChannelStatus[];
    adminChannels: ChannelStatus[];
    selectedChannel: any | null;
    setSelectedChannel: (channel: any | null) => void;
    isLoading: boolean;
    error: string | null;
    setUserChannels: (channels: ChannelStatus[]) => void;
    setAdminChannels: (channels: ChannelStatus[]) => void;
    setLoading: (loading: boolean) => void;
    setError: (error: string | null) => void;
}

export const useChannelsStore = create<ChannelsState>((set) => ({
    userChannels: [],
    adminChannels: [],
    selectedChannel: null,
    setSelectedChannel: (selectedChannel) => set({ selectedChannel }),
    isLoading: false,
    error: null,
    setUserChannels: (userChannels) => set({ userChannels }),
    setAdminChannels: (adminChannels) => set({ adminChannels }),
    setLoading: (isLoading) => set({ isLoading }),
    setError: (error) => set({ error }),
}));
