import { create } from 'zustand';

interface ChannelsState {
    channels: any[] | null;
    selectedChannel: any | null;
    isLoading: boolean;
    error: string | null;
    setChannels: (channels: any[] | null) => void;
    setSelectedChannel: (channel: any | null) => void;
    setLoading: (loading: boolean) => void;
    setError: (error: string | null) => void;
}

export const useChannelsStore = create<ChannelsState>((set) => ({
    channels: null,
    selectedChannel: null,
    isLoading: false,
    error: null,
    setChannels: (channels) => set({ channels }),
    setSelectedChannel: (selectedChannel) => set({ selectedChannel }),
    setLoading: (isLoading) => set({ isLoading }),
    setError: (error) => set({ error }),
}));
