'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Level } from '@/types';

// Domyślne poziomy (fallback)
const DEFAULT_LEVELS: Level[] = [
  { id: 1, name: 'Nowicjusz', min_xp: 0, max_xp: 200, badge_icon: '🌱', badge_color: '#94a3b8' },
  { id: 2, name: 'Street Racer', min_xp: 201, max_xp: 500, badge_icon: '🏎️', badge_color: '#22c55e' },
  { id: 3, name: 'Road Warrior', min_xp: 501, max_xp: 1000, badge_icon: '⚡', badge_color: '#3b82f6' },
  { id: 4, name: 'Turbo Pilot', min_xp: 1001, max_xp: 2000, badge_icon: '🚀', badge_color: '#8b5cf6' },
  { id: 5, name: 'Speed Demon', min_xp: 2001, max_xp: 3500, badge_icon: '👹', badge_color: '#ec4899' },
  { id: 6, name: 'Racing Elite', min_xp: 3501, max_xp: 5000, badge_icon: '🏆', badge_color: '#f59e0b' },
  { id: 7, name: 'Velocity Master', min_xp: 5001, max_xp: 7000, badge_icon: '💎', badge_color: '#06b6d4' },
  { id: 8, name: 'Turbo Champion', min_xp: 7001, max_xp: 9000, badge_icon: '👑', badge_color: '#eab308' },
  { id: 9, name: 'Grand Master', min_xp: 9001, max_xp: 12000, badge_icon: '🌟', badge_color: '#f97316' },
  { id: 10, name: 'Turbo Legenda', min_xp: 12001, max_xp: 999999, badge_icon: '🔥', badge_color: '#ef4444' },
];

// Cache na poziomy
let cachedLevels: Level[] | null = null;
let cacheTimestamp: number = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minut

export function useLevels() {
  const [levels, setLevels] = useState<Level[]>(cachedLevels || DEFAULT_LEVELS);
  const [loading, setLoading] = useState(!cachedLevels);

  const fetchLevels = useCallback(async () => {
    // Użyj cache jeśli jest aktualny
    if (cachedLevels && Date.now() - cacheTimestamp < CACHE_DURATION) {
      setLevels(cachedLevels);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('levels')
        .select('*')
        .order('id', { ascending: true });

      if (!error && data && data.length > 0) {
        // Konwertuj max_xp na odpowiedni format
        const formattedLevels = data.map((level, index) => ({
          ...level,
          max_xp: data[index + 1]?.min_xp ? data[index + 1].min_xp - 1 : 999999,
        }));
        cachedLevels = formattedLevels;
        cacheTimestamp = Date.now();
        setLevels(formattedLevels);
      } else {
        // Fallback do domyślnych
        setLevels(DEFAULT_LEVELS);
      }
    } catch {
      setLevels(DEFAULT_LEVELS);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLevels();
  }, [fetchLevels]);

  // Oblicz poziom na podstawie XP
  const calculateLevel = useCallback((xp: number): Level => {
    const currentLevels = cachedLevels || levels;
    for (let i = currentLevels.length - 1; i >= 0; i--) {
      if (xp >= currentLevels[i].min_xp) {
        return currentLevels[i];
      }
    }
    return currentLevels[0];
  }, [levels]);

  // Oblicz postęp do następnego poziomu (procent)
  const calculateLevelProgress = useCallback((xp: number): number => {
    const currentLevels = cachedLevels || levels;
    const currentLevel = calculateLevel(xp);
    const currentLevelIndex = currentLevels.findIndex(l => l.id === currentLevel.id);

    if (currentLevelIndex === currentLevels.length - 1) {
      return 100;
    }

    const nextLevel = currentLevels[currentLevelIndex + 1];
    const xpInCurrentLevel = xp - currentLevel.min_xp;
    const xpNeededForNextLevel = nextLevel.min_xp - currentLevel.min_xp;

    return Math.min(100, Math.round((xpInCurrentLevel / xpNeededForNextLevel) * 100));
  }, [levels, calculateLevel]);

  // XP potrzebne do następnego poziomu
  const xpToNextLevel = useCallback((xp: number): number => {
    const currentLevels = cachedLevels || levels;
    const currentLevel = calculateLevel(xp);
    const currentLevelIndex = currentLevels.findIndex(l => l.id === currentLevel.id);

    if (currentLevelIndex === currentLevels.length - 1) {
      return 0;
    }

    const nextLevel = currentLevels[currentLevelIndex + 1];
    return nextLevel.min_xp - xp;
  }, [levels, calculateLevel]);

  // Pobierz następny poziom
  const getNextLevel = useCallback((currentLevelId: number): Level | null => {
    const currentLevels = cachedLevels || levels;
    const index = currentLevels.findIndex(l => l.id === currentLevelId);
    if (index === -1 || index === currentLevels.length - 1) {
      return null;
    }
    return currentLevels[index + 1];
  }, [levels]);

  // Wyczyść cache (np. po zapisie w adminie)
  const invalidateCache = useCallback(() => {
    cachedLevels = null;
    cacheTimestamp = 0;
    fetchLevels();
  }, [fetchLevels]);

  return {
    levels,
    loading,
    calculateLevel,
    calculateLevelProgress,
    xpToNextLevel,
    getNextLevel,
    invalidateCache,
    refetch: fetchLevels,
  };
}

// Eksport dla kompatybilności wstecznej
export { DEFAULT_LEVELS };
