'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { CollectibleCard, UserCard, CardRarity } from '@/types';

interface UseCardsOptions {
  userId?: string;
}

interface UseCardsReturn {
  allCards: CollectibleCard[];
  userCards: UserCard[];
  loading: boolean;
  error: string | null;
  getCardById: (cardId: string) => CollectibleCard | undefined;
  getUserCardCount: (cardId: string) => number;
  hasCard: (cardId: string) => boolean;
  getCardsByRarity: (rarity: CardRarity) => CollectibleCard[];
  getCardsByCategory: (category: string) => CollectibleCard[];
  getCollectionStats: () => {
    total: number;
    collected: number;
    byRarity: Record<CardRarity, { total: number; collected: number }>;
  };
  refreshCards: () => Promise<void>;
}

// Konfiguracja rzadkości kart
export const RARITY_CONFIG: Record<CardRarity, {
  name: string;
  color: string;
  bgColor: string;
  borderColor: string;
  glowColor: string;
  icon: string;
}> = {
  common: {
    name: 'Zwykła',
    color: 'text-gray-400',
    bgColor: 'bg-gray-500/20',
    borderColor: 'border-gray-500/50',
    glowColor: '',
    icon: '⚪',
  },
  rare: {
    name: 'Rzadka',
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/20',
    borderColor: 'border-blue-500/50',
    glowColor: 'shadow-blue-500/30',
    icon: '🔵',
  },
  epic: {
    name: 'Epicka',
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/20',
    borderColor: 'border-purple-500/50',
    glowColor: 'shadow-purple-500/30',
    icon: '🟣',
  },
  legendary: {
    name: 'Legendarna',
    color: 'text-yellow-400',
    bgColor: 'bg-yellow-500/20',
    borderColor: 'border-yellow-500/50',
    glowColor: 'shadow-yellow-500/40',
    icon: '🌟',
  },
};

export function useCards({ userId }: UseCardsOptions = {}): UseCardsReturn {
  const [allCards, setAllCards] = useState<CollectibleCard[]>([]);
  const [userCards, setUserCards] = useState<UserCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCards = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Pobierz wszystkie aktywne karty
      const { data: cardsData, error: cardsError } = await supabase
        .from('cards')
        .select('*')
        .eq('is_active', true)
        .order('rarity', { ascending: true })
        .order('name', { ascending: true });

      if (cardsError) {
        console.error('Error fetching cards:', cardsError);
        // Jeśli tabela nie istnieje, użyj pustej tablicy
        setAllCards([]);
      } else {
        setAllCards(cardsData as CollectibleCard[]);
      }

      // Pobierz karty użytkownika jeśli podano userId
      if (userId) {
        const { data: userCardsData, error: userCardsError } = await supabase
          .from('user_cards')
          .select('*, card:cards(*)')
          .eq('user_id', userId)
          .order('obtained_at', { ascending: false });

        if (userCardsError) {
          console.error('Error fetching user cards:', userCardsError);
          setUserCards([]);
        } else {
          setUserCards(userCardsData as UserCard[]);
        }
      }
    } catch (e) {
      console.error('Error in fetchCards:', e);
      setError('Nie udało się pobrać kart');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchCards();
  }, [fetchCards]);

  const getCardById = useCallback(
    (cardId: string) => allCards.find(c => c.id === cardId),
    [allCards]
  );

  const getUserCardCount = useCallback(
    (cardId: string) => userCards.filter(uc => uc.card_id === cardId).length,
    [userCards]
  );

  const hasCard = useCallback(
    (cardId: string) => userCards.some(uc => uc.card_id === cardId),
    [userCards]
  );

  const getCardsByRarity = useCallback(
    (rarity: CardRarity) => allCards.filter(c => c.rarity === rarity),
    [allCards]
  );

  const getCardsByCategory = useCallback(
    (category: string) => allCards.filter(c => c.category === category),
    [allCards]
  );

  const getCollectionStats = useCallback(() => {
    const collectedCardIds = new Set(userCards.map(uc => uc.card_id));

    const byRarity: Record<CardRarity, { total: number; collected: number }> = {
      common: { total: 0, collected: 0 },
      rare: { total: 0, collected: 0 },
      epic: { total: 0, collected: 0 },
      legendary: { total: 0, collected: 0 },
    };

    allCards.forEach(card => {
      byRarity[card.rarity].total++;
      if (collectedCardIds.has(card.id)) {
        byRarity[card.rarity].collected++;
      }
    });

    return {
      total: allCards.length,
      collected: collectedCardIds.size,
      byRarity,
    };
  }, [allCards, userCards]);

  return {
    allCards,
    userCards,
    loading,
    error,
    getCardById,
    getUserCardCount,
    hasCard,
    getCardsByRarity,
    getCardsByCategory,
    getCollectionStats,
    refreshCards: fetchCards,
  };
}
