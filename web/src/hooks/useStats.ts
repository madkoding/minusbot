import { useCallback } from 'react';
import { statsService } from '../services/statsService';
import { useStatsStore } from '../stores/useStatsStore';

export function useStats() {
    const {
        userStats,
        isLoading,
        error,
        setUserStats,
        setLoading,
        setError
    } = useStatsStore();

    const fetchStats = useCallback(async () => {
        setLoading(true);
        try {
            const data = await statsService.get();
            setUserStats(data);
            setError(null);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [setLoading, setUserStats, setError]);

    return {
        stats: userStats,
        isLoading,
        error,
        fetchStats
    };
}

export function useStatsAsAdmin() {
    const {
        adminStats,
        isLoading,
        error,
        setAdminStats,
        setLoading,
        setError
    } = useStatsStore();

    const fetchStats = useCallback(async () => {
        setLoading(true);
        try {
            const data = await statsService.getAsAdmin();
            setAdminStats(data);
            setError(null);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [setLoading, setAdminStats, setError]);

    return {
        stats: adminStats,
        isLoading,
        error,
        fetchStats
    };
}
