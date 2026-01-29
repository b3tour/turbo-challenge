'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

export interface ArenaRankingEntry {
  rank: number;
  user_id: string;
  nick: string;
  avatar_url?: string;
  battle_wins: number;
  tuning_wins: number;
  total_wins: number;
}

export function useArenaRankings() {
  const [rankings, setRankings] = useState<ArenaRankingEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRankings = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch battle wins (card_battles)
      const { data: battleData, error: battleError } = await supabase
        .from('card_battles')
        .select('winner_id')
        .eq('status', 'completed')
        .not('winner_id', 'is', null);

      if (battleError) console.error('Error fetching battle wins:', battleError);

      // Fetch tuning wins (tuning_challenges)
      const { data: tuningData, error: tuningError } = await supabase
        .from('tuning_challenges')
        .select('winner_id')
        .eq('status', 'completed')
        .not('winner_id', 'is', null);

      if (tuningError) console.error('Error fetching tuning wins:', tuningError);

      // Count wins per user
      const winsMap = new Map<string, { battle_wins: number; tuning_wins: number }>();

      for (const row of battleData || []) {
        if (!row.winner_id) continue;
        const entry = winsMap.get(row.winner_id) || { battle_wins: 0, tuning_wins: 0 };
        entry.battle_wins++;
        winsMap.set(row.winner_id, entry);
      }

      for (const row of tuningData || []) {
        if (!row.winner_id) continue;
        const entry = winsMap.get(row.winner_id) || { battle_wins: 0, tuning_wins: 0 };
        entry.tuning_wins++;
        winsMap.set(row.winner_id, entry);
      }

      if (winsMap.size === 0) {
        setRankings([]);
        setLoading(false);
        return;
      }

      // Fetch user profiles
      const userIds = Array.from(winsMap.keys());
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('id, nick, avatar_url')
        .in('id', userIds);

      if (usersError) console.error('Error fetching users:', usersError);

      const usersMap = new Map((users || []).map(u => [u.id, u]));

      // Build ranking entries
      const entries: ArenaRankingEntry[] = [];
      winsMap.forEach((wins, userId) => {
        const user = usersMap.get(userId);
        if (!user) return;
        entries.push({
          rank: 0,
          user_id: userId,
          nick: user.nick,
          avatar_url: user.avatar_url,
          battle_wins: wins.battle_wins,
          tuning_wins: wins.tuning_wins,
          total_wins: wins.battle_wins + wins.tuning_wins,
        });
      });

      // Sort by total_wins desc, then battle_wins desc
      entries.sort((a, b) => b.total_wins - a.total_wins || b.battle_wins - a.battle_wins);

      // Assign ranks
      entries.forEach((entry, i) => {
        entry.rank = i + 1;
      });

      setRankings(entries);
    } catch (e) {
      console.error('Error fetching arena rankings:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRankings();
  }, [fetchRankings]);

  const getUserArenaRank = (userId: string): number | null => {
    const entry = rankings.find(r => r.user_id === userId);
    return entry ? entry.rank : null;
  };

  return {
    rankings,
    loading,
    getUserArenaRank,
    refresh: fetchRankings,
  };
}
