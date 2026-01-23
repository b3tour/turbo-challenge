'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { LeaderboardEntry } from '@/types';
import { LEVELS } from '@/lib/utils';

interface UseLeaderboardOptions {
  limit?: number;
  realtime?: boolean;
}

// GLOBALNY CACHE - współdzielony między wszystkimi komponentami
const globalCache = {
  leaderboard: null as LeaderboardEntry[] | null,
  totalParticipants: 0,
  lastFetch: 0,
  isFetching: false,
  CACHE_TTL: 30000, // 30 sekund
};

export function useLeaderboard(options: UseLeaderboardOptions = {}) {
  const { limit = 100, realtime = true } = options;

  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>(globalCache.leaderboard || []);
  const [loading, setLoading] = useState(!globalCache.leaderboard);
  const [error, setError] = useState<string | null>(null);
  const [totalParticipants, setTotalParticipants] = useState(globalCache.totalParticipants);
  const mountedRef = useRef(true);

  const fetchLeaderboard = useCallback(async (force = false) => {
    const now = Date.now();

    // Użyj cache jeśli świeży
    if (!force && globalCache.leaderboard && (now - globalCache.lastFetch) < globalCache.CACHE_TTL) {
      if (mountedRef.current) {
        setLeaderboard(globalCache.leaderboard);
        setTotalParticipants(globalCache.totalParticipants);
        setLoading(false);
      }
      return;
    }

    // Zapobiegaj równoległym zapytaniom
    if (globalCache.isFetching) {
      await new Promise(resolve => setTimeout(resolve, 100));
      if (globalCache.leaderboard && mountedRef.current) {
        setLeaderboard(globalCache.leaderboard);
        setTotalParticipants(globalCache.totalParticipants);
        setLoading(false);
      }
      return;
    }

    globalCache.isFetching = true;

    // Tylko przy pierwszym ładowaniu pokazuj loading
    if (!globalCache.leaderboard && mountedRef.current) {
      setLoading(true);
    }
    setError(null);

    try {
      // Pobierz użytkowników z ich XP
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('id, nick, avatar_url, total_xp, level')
        .order('total_xp', { ascending: false })
        .limit(limit);

      if (usersError) throw usersError;

      // Pobierz liczbę ukończonych misji dla wszystkich użytkowników w JEDNYM zapytaniu
      const userIds = users?.map(u => u.id) || [];

      const { data: submissions } = await supabase
        .from('submissions')
        .select('user_id')
        .eq('status', 'approved')
        .in('user_id', userIds);

      // Zlicz misje na użytkownika
      const missionCounts: Record<string, number> = {};
      submissions?.forEach(s => {
        missionCounts[s.user_id] = (missionCounts[s.user_id] || 0) + 1;
      });

      // Zbuduj leaderboard
      const leaderboardData: LeaderboardEntry[] = (users || []).map((user, index) => {
        const level = LEVELS.find(l => l.id === user.level) || LEVELS[0];
        return {
          rank: index + 1,
          user_id: user.id,
          nick: user.nick,
          avatar_url: user.avatar_url,
          total_xp: user.total_xp,
          level: user.level,
          level_name: level.name,
          missions_completed: missionCounts[user.id] || 0,
        };
      });

      // Pobierz całkowitą liczbę uczestników
      const { count } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true });

      // Zapisz do cache
      globalCache.leaderboard = leaderboardData;
      globalCache.totalParticipants = count || 0;
      globalCache.lastFetch = Date.now();

      if (mountedRef.current) {
        setLeaderboard(leaderboardData);
        setTotalParticipants(count || 0);
      }
    } catch (e: any) {
      console.error('Error fetching leaderboard:', e);
      if (mountedRef.current) {
        setError(e.message);
      }
    } finally {
      globalCache.isFetching = false;
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [limit]);

  // Pobierz pozycję konkretnego użytkownika - z cache
  const getUserRank = useCallback((userId: string): number | null => {
    const data = globalCache.leaderboard || leaderboard;
    const index = data.findIndex(u => u.user_id === userId);
    return index >= 0 ? index + 1 : null;
  }, [leaderboard]);

  // Pobierz ranking z okolic użytkownika
  const getUserNeighbors = useCallback((userId: string, range: number = 5): LeaderboardEntry[] => {
    const data = globalCache.leaderboard || leaderboard;
    const rank = data.findIndex(u => u.user_id === userId);
    if (rank < 0) return [];

    const startRank = Math.max(0, rank - range);
    const endRank = Math.min(data.length, rank + range + 1);

    return data.slice(startRank, endRank);
  }, [leaderboard]);

  // Setup real-time subscription z debounce
  useEffect(() => {
    mountedRef.current = true;
    fetchLeaderboard();

    if (!realtime) return;

    let debounceTimer: NodeJS.Timeout | null = null;

    const debouncedFetch = () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        fetchLeaderboard(true);
      }, 1000); // Debounce 1 sekunda
    };

    const subscription = supabase
      .channel('leaderboard-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'users' }, debouncedFetch)
      .subscribe();

    return () => {
      mountedRef.current = false;
      if (debounceTimer) clearTimeout(debounceTimer);
      subscription.unsubscribe();
    };
  }, [fetchLeaderboard, realtime]);

  // Statystyki ogólne - z cache
  const getStats = useCallback(() => {
    const data = globalCache.leaderboard || leaderboard;
    if (data.length === 0) {
      return { totalXP: 0, avgXP: 0, topScore: 0, totalMissions: 0 };
    }

    const totalXP = data.reduce((sum, entry) => sum + entry.total_xp, 0);
    const totalMissions = data.reduce((sum, entry) => sum + entry.missions_completed, 0);

    return {
      totalXP,
      avgXP: Math.round(totalXP / data.length),
      topScore: data[0]?.total_xp || 0,
      totalMissions,
    };
  }, [leaderboard]);

  // Ranking speedrun dla konkretnego quizu
  interface SpeedrunEntry {
    rank: number;
    user_id: string;
    nick: string;
    avatar_url?: string;
    time_ms: number;
    created_at: string;
  }

  const getSpeedrunLeaderboard = useCallback(async (missionId: string, topN: number = 10): Promise<SpeedrunEntry[]> => {
    const { data, error: fetchError } = await supabase
      .from('submissions')
      .select('user_id, quiz_time_ms, created_at, user:users!submissions_user_id_fkey(nick, avatar_url)')
      .eq('mission_id', missionId)
      .eq('status', 'approved')
      .not('quiz_time_ms', 'is', null)
      .order('quiz_time_ms', { ascending: true })
      .limit(topN);

    if (fetchError || !data) return [];

    return data.map((entry, index) => {
      const userInfo = entry.user as unknown as { nick: string; avatar_url?: string } | null;
      return {
        rank: index + 1,
        user_id: entry.user_id,
        nick: userInfo?.nick || 'Nieznany',
        avatar_url: userInfo?.avatar_url,
        time_ms: entry.quiz_time_ms!,
        created_at: entry.created_at,
      };
    });
  }, []);

  const getUserSpeedrunRank = useCallback(async (missionId: string, userId: string): Promise<{ rank: number; time_ms: number } | null> => {
    const { data, error: fetchError } = await supabase
      .from('submissions')
      .select('user_id, quiz_time_ms')
      .eq('mission_id', missionId)
      .eq('status', 'approved')
      .not('quiz_time_ms', 'is', null)
      .order('quiz_time_ms', { ascending: true });

    if (fetchError || !data) return null;

    const userEntry = data.find(e => e.user_id === userId);
    if (!userEntry) return null;

    const rank = data.findIndex(e => e.user_id === userId) + 1;
    return { rank, time_ms: userEntry.quiz_time_ms! };
  }, []);

  return {
    leaderboard,
    loading,
    error,
    totalParticipants,
    refetch: () => fetchLeaderboard(true),
    getUserRank,
    getUserNeighbors,
    getStats,
    getSpeedrunLeaderboard,
    getUserSpeedrunRank,
  };
}
