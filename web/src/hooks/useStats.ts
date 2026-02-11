import { useCallback } from 'react';
import { statsService } from '../services/statsService';
import { useStatsStore } from '../stores/useStatsStore';

export function useStats() {
    const {
        userStats,
        adminStats,
        isLoading,
        error,
        setUserStats,
        setAdminStats,
        setLoading,
        setError
    } = useStatsStore();

    const fetchUserStats = useCallback(async () => {
        setLoading(true);
        try {
            const data = await statsService.getUserStats();
            setUserStats(data);
            setError(null);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [setLoading, setUserStats, setError]);

    const fetchAdminStats = useCallback(async () => {
        setLoading(true);
        try {
            const data = await statsService.getAdminStats();
            setAdminStats(data);
            setError(null);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [setLoading, setAdminStats, setError]);

    return {
        userStats,
        adminStats,
        isLoading,
        error,
        fetchUserStats,
        fetchAdminStats
    };
}
