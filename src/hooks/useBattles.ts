'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { CardBattle, BattleCategory, BattleRewardType, CollectibleCard, User } from '@/types';
import { sendUserNotification } from '@/hooks/useAnnouncements';

interface UseBattlesOptions {
  userId?: string;
}

interface BattleWithDetails extends CardBattle {
  challenger?: User;
  opponent?: User;
  challenger_cards?: CollectibleCard[];
  opponent_cards?: CollectibleCard[];
}

// Oblicz wynik dla kategorii
function calculateScore(cards: CollectibleCard[], category: BattleCategory): number {
  return cards.reduce((sum, card) => {
    switch (category) {
      case 'power':
        return sum + (card.car_horsepower || 0);
      case 'torque':
        return sum + (card.car_torque || 0);
      case 'speed':
        return sum + (card.car_max_speed || 0);
      case 'total':
        return sum + (card.car_horsepower || 0) + (card.car_torque || 0) + (card.car_max_speed || 0);
      default:
        return sum;
    }
  }, 0);
}

// Nazwa kategorii po polsku
export function getCategoryName(category: BattleCategory): string {
  switch (category) {
    case 'power': return 'Moc (KM)';
    case 'torque': return 'Moment obrotowy (Nm)';
    case 'speed': return 'Prędkość max (km/h)';
    case 'total': return 'Suma parametrów';
  }
}

// Ikona kategorii
export function getCategoryIcon(category: BattleCategory): string {
  switch (category) {
    case 'power': return '⚡';
    case 'torque': return '🔧';
    case 'speed': return '💨';
    case 'total': return '🏆';
  }
}

export function useBattles(options: UseBattlesOptions = {}) {
  const { userId } = options;

  const [myBattles, setMyBattles] = useState<BattleWithDetails[]>([]);
  const [incomingChallenges, setIncomingChallenges] = useState<BattleWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Pobierz bitwy użytkownika
  const fetchBattles = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      // Pobierz bitwy gdzie jestem challengerem lub przeciwnikiem
      const { data: battles, error: battlesError } = await supabase
        .from('card_battles')
        .select(`
          *,
          challenger:users!card_battles_challenger_id_fkey(id, nick, avatar_url),
          opponent:users!card_battles_opponent_id_fkey(id, nick, avatar_url)
        `)
        .or(`challenger_id.eq.${userId},opponent_id.eq.${userId}`)
        .order('created_at', { ascending: false });

      if (battlesError) throw battlesError;

      // Pobierz karty dla każdej bitwy
      const battlesWithCards: BattleWithDetails[] = await Promise.all(
        (battles || []).map(async (battle) => {
          // Pobierz karty challengera
          const challengerCardIds = battle.challenger_card_ids || [];
          let challengerCards: CollectibleCard[] = [];
          if (challengerCardIds.length > 0) {
            const { data: cards } = await supabase
              .from('cards')
              .select('*')
              .in('id', challengerCardIds);
            challengerCards = cards || [];
          }

          // Pobierz karty przeciwnika (jeśli zaakceptował)
          const opponentCardIds = battle.opponent_card_ids || [];
          let opponentCards: CollectibleCard[] = [];
          if (opponentCardIds.length > 0) {
            const { data: cards } = await supabase
              .from('cards')
              .select('*')
              .in('id', opponentCardIds);
            opponentCards = cards || [];
          }

          return {
            ...battle,
            challenger_cards: challengerCards,
            opponent_cards: opponentCards,
          } as BattleWithDetails;
        })
      );

      // Rozdziel na historię bitew i przychodzące wyzwania
      // Historia: wszystkie bitwy użytkownika OPRÓCZ pending incoming (te są w "Wyzwania")
      const my = battlesWithCards.filter(b =>
        !(b.opponent_id === userId && b.status === 'pending')
      );
      const incoming = battlesWithCards.filter(
        b => b.opponent_id === userId && b.status === 'pending'
      );

      setMyBattles(my);
      setIncomingChallenges(incoming);
    } catch (e: any) {
      console.error('Error fetching battles:', e);
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchBattles();
  }, [fetchBattles]);

  // Sprawdź ile wyzwań wysłano w tym tygodniu
  const getChallengesSentThisWeek = useCallback(async (): Promise<number> => {
    if (!userId) return 0;

    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const { count } = await supabase
      .from('card_battles')
      .select('*', { count: 'exact', head: true })
      .eq('challenger_id', userId)
      .gte('created_at', weekAgo.toISOString());

    return count || 0;
  }, [userId]);

  // Utwórz nowe wyzwanie
  const createChallenge = useCallback(async (
    opponentId: string,
    cardIds: string[],
    category: BattleCategory,
    rewardType: BattleRewardType
  ): Promise<{ success: boolean; error?: string; battle?: CardBattle }> => {
    if (!userId) return { success: false, error: 'Nie jesteś zalogowany' };

    if (cardIds.length < 2) {
      return { success: false, error: 'Musisz wybrać minimum 2 karty' };
    }

    // Sprawdź limit tygodniowy
    const sentThisWeek = await getChallengesSentThisWeek();
    if (sentThisWeek >= 3) {
      return { success: false, error: 'Osiągnąłeś limit 3 wyzwań na tydzień' };
    }

    // Sprawdź czy nie wyzywasz siebie
    if (opponentId === userId) {
      return { success: false, error: 'Nie możesz wyzwać samego siebie' };
    }

    // Sprawdź czy karty należą do użytkownika
    const { data: userCards } = await supabase
      .from('user_cards')
      .select('card_id')
      .eq('user_id', userId)
      .in('card_id', cardIds);

    if (!userCards || userCards.length < cardIds.length) {
      return { success: false, error: 'Nie posiadasz wszystkich wybranych kart' };
    }

    // Oblicz datę wygaśnięcia (7 dni)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const { data, error: insertError } = await supabase
      .from('card_battles')
      .insert({
        challenger_id: userId,
        opponent_id: opponentId,
        category,
        reward_type: rewardType,
        challenger_card_ids: cardIds,
        status: 'pending',
        expires_at: expiresAt.toISOString(),
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error creating challenge:', insertError);
      return { success: false, error: insertError.message };
    }

    // Pobierz nick wyzywającego i wyślij powiadomienie do przeciwnika
    const { data: challengerData } = await supabase
      .from('users')
      .select('nick')
      .eq('id', userId)
      .single();

    const challengerNick = challengerData?.nick || 'Gracz';
    const categoryName = getCategoryName(category);

    await sendUserNotification(
      opponentId,
      'Nowe wyzwanie!',
      `${challengerNick} wyzwał Cię na Turbo Bitwę! Kategoria: ${categoryName}. Masz 7 dni na odpowiedź.`,
      'battle_challenge',
      { battle_id: data.id, challenger_nick: challengerNick, category }
    );

    await fetchBattles();
    return { success: true, battle: data };
  }, [userId, getChallengesSentThisWeek, fetchBattles, getCategoryName]);

  // Akceptuj wyzwanie i wybierz karty
  const acceptChallenge = useCallback(async (
    battleId: string,
    cardIds: string[]
  ): Promise<{ success: boolean; error?: string; winner?: string }> => {
    if (!userId) return { success: false, error: 'Nie jesteś zalogowany' };

    // Pobierz bitwę
    const { data: battle, error: fetchError } = await supabase
      .from('card_battles')
      .select('*, challenger_card_ids')
      .eq('id', battleId)
      .single();

    if (fetchError || !battle) {
      return { success: false, error: 'Nie znaleziono bitwy' };
    }

    if (battle.opponent_id !== userId) {
      return { success: false, error: 'To nie jest Twoje wyzwanie' };
    }

    if (battle.status !== 'pending') {
      return { success: false, error: 'To wyzwanie już zostało rozstrzygnięte' };
    }

    // Wymusz tę samą liczbę kart co challenger
    const requiredCards = (battle.challenger_card_ids || []).length;
    if (cardIds.length !== requiredCards) {
      return { success: false, error: `Musisz wybrać dokładnie ${requiredCards} kart` };
    }

    // Sprawdź czy karty należą do użytkownika
    const { data: userCards } = await supabase
      .from('user_cards')
      .select('card_id')
      .eq('user_id', userId)
      .in('card_id', cardIds);

    if (!userCards || userCards.length < cardIds.length) {
      return { success: false, error: 'Nie posiadasz wszystkich wybranych kart' };
    }

    // Pobierz karty obu stron
    const { data: challengerCards } = await supabase
      .from('cards')
      .select('*')
      .in('id', battle.challenger_card_ids);

    const { data: opponentCards } = await supabase
      .from('cards')
      .select('*')
      .in('id', cardIds);

    if (!challengerCards || !opponentCards) {
      return { success: false, error: 'Błąd pobierania kart' };
    }

    // Oblicz wyniki
    const challengerScore = calculateScore(challengerCards, battle.category);
    const opponentScore = calculateScore(opponentCards, battle.category);

    // Określ zwycięzcę
    let winnerId: string | null = null;
    if (challengerScore > opponentScore) {
      winnerId = battle.challenger_id;
    } else if (opponentScore > challengerScore) {
      winnerId = battle.opponent_id;
    }
    // Remis = brak zwycięzcy

    // Aktualizuj bitwę
    const { error: updateError } = await supabase
      .from('card_battles')
      .update({
        opponent_card_ids: cardIds,
        status: 'completed',
        winner_id: winnerId,
        challenger_score: challengerScore,
        opponent_score: opponentScore,
        completed_at: new Date().toISOString(),
      })
      .eq('id', battleId);

    if (updateError) {
      return { success: false, error: updateError.message };
    }

    // Przyznaj nagrody
    if (winnerId && battle.reward_type === 'xp') {
      // Zwycięzca dostaje 100 XP, przegrany 20 XP
      const loserId = winnerId === battle.challenger_id ? battle.opponent_id : battle.challenger_id;

      await supabase.rpc('add_xp', { user_id: winnerId, xp_amount: 100 });
      await supabase.rpc('add_xp', { user_id: loserId, xp_amount: 20 });
    } else if (winnerId && battle.reward_type === 'cards') {
      // Zwycięzca zabiera karty przegranego
      const loserId = winnerId === battle.challenger_id ? battle.opponent_id : battle.challenger_id;
      const loserCardIds = winnerId === battle.challenger_id ? cardIds : battle.challenger_card_ids;

      // Przenieś karty do zwycięzcy
      for (const cardId of loserCardIds) {
        await supabase
          .from('user_cards')
          .update({ user_id: winnerId, obtained_from: 'trade' })
          .eq('user_id', loserId)
          .eq('card_id', cardId);
      }
    }

    // Wyślij powiadomienia o wyniku do obu graczy
    const { data: usersData } = await supabase
      .from('users')
      .select('id, nick')
      .in('id', [battle.challenger_id, battle.opponent_id]);

    const challenger = usersData?.find(u => u.id === battle.challenger_id);
    const opponent = usersData?.find(u => u.id === battle.opponent_id);

    if (winnerId) {
      const winnerNick = winnerId === battle.challenger_id ? challenger?.nick : opponent?.nick;
      const loserNick = winnerId === battle.challenger_id ? opponent?.nick : challenger?.nick;
      const loserId = winnerId === battle.challenger_id ? battle.opponent_id : battle.challenger_id;

      // Powiadomienie dla zwycięzcy
      await sendUserNotification(
        winnerId,
        'Wygrana w Turbo Bitwie!',
        `Pokonałeś ${loserNick}! Wynik: ${winnerId === battle.challenger_id ? challengerScore : opponentScore} vs ${winnerId === battle.challenger_id ? opponentScore : challengerScore}. +100 XP!`,
        'battle_result',
        { battle_id: battleId, result: 'win', xp_gained: 100 }
      );

      // Powiadomienie dla przegranego
      await sendUserNotification(
        loserId,
        'Przegrana w Turbo Bitwie',
        `${winnerNick} wygrał bitwę. Wynik: ${loserId === battle.challenger_id ? challengerScore : opponentScore} vs ${loserId === battle.challenger_id ? opponentScore : challengerScore}. +20 XP za udział.`,
        'battle_result',
        { battle_id: battleId, result: 'loss', xp_gained: 20 }
      );
    } else {
      // Remis - powiadomienia dla obu
      await sendUserNotification(
        battle.challenger_id,
        'Remis w Turbo Bitwie!',
        `Bitwa z ${opponent?.nick} zakończyła się remisem! Wynik: ${challengerScore} vs ${opponentScore}.`,
        'battle_result',
        { battle_id: battleId, result: 'draw' }
      );

      await sendUserNotification(
        battle.opponent_id,
        'Remis w Turbo Bitwie!',
        `Bitwa z ${challenger?.nick} zakończyła się remisem! Wynik: ${opponentScore} vs ${challengerScore}.`,
        'battle_result',
        { battle_id: battleId, result: 'draw' }
      );
    }

    await fetchBattles();
    return { success: true, winner: winnerId || undefined };
  }, [userId, fetchBattles]);

  // Odrzuć wyzwanie
  const declineChallenge = useCallback(async (battleId: string): Promise<{ success: boolean; error?: string }> => {
    if (!userId) return { success: false, error: 'Nie jesteś zalogowany' };

    // Pobierz bitwę żeby znać challenger_id
    const { data: battle } = await supabase
      .from('card_battles')
      .select('challenger_id')
      .eq('id', battleId)
      .eq('opponent_id', userId)
      .single();

    const { error: updateError } = await supabase
      .from('card_battles')
      .update({ status: 'declined' })
      .eq('id', battleId)
      .eq('opponent_id', userId);

    if (updateError) {
      return { success: false, error: updateError.message };
    }

    // Wyślij powiadomienie do wyzywającego
    if (battle) {
      const { data: opponentData } = await supabase
        .from('users')
        .select('nick')
        .eq('id', userId)
        .single();

      await sendUserNotification(
        battle.challenger_id,
        'Wyzwanie odrzucone',
        `${opponentData?.nick || 'Gracz'} odrzucił Twoje wyzwanie na Turbo Bitwę.`,
        'battle_result',
        { battle_id: battleId, result: 'declined' }
      );
    }

    await fetchBattles();
    return { success: true };
  }, [userId, fetchBattles]);

  // Pobierz listę graczy do wyzwania (z wystarczającą liczbą kart)
  const getChallengablePlayers = useCallback(async (limit: number = 20): Promise<User[]> => {
    if (!userId) return [];

    // Pobierz użytkowników którzy mają min. 2 karty samochodów
    // Uwaga: Supabase domyślnie zwraca max 1000 wierszy - podnosimy limit
    const { data: usersWithCards, error: cardsError } = await supabase
      .from('user_cards')
      .select('user_id, card:cards!inner(card_type)')
      .eq('card.card_type', 'car')
      .neq('user_id', userId)
      .limit(5000);

    if (cardsError) {
      console.error('Error fetching challengable players:', cardsError);
      return [];
    }

    if (!usersWithCards || usersWithCards.length === 0) return [];

    // Zlicz karty na użytkownika
    const cardCounts: Record<string, number> = {};
    usersWithCards.forEach(uc => {
      cardCounts[uc.user_id] = (cardCounts[uc.user_id] || 0) + 1;
    });

    // Filtruj tych z min. 2 kartami
    const eligibleUserIds = Object.entries(cardCounts)
      .filter(([_, count]) => count >= 2)
      .map(([id]) => id);

    if (eligibleUserIds.length === 0) return [];

    // Pobierz dane użytkowników
    const { data: users } = await supabase
      .from('users')
      .select('id, nick, avatar_url, total_xp, level')
      .in('id', eligibleUserIds)
      .order('total_xp', { ascending: false })
      .limit(limit);

    return (users || []) as User[];
  }, [userId]);

  // Pobierz moje karty samochodów do wyboru
  const getMyCars = useCallback(async (): Promise<CollectibleCard[]> => {
    if (!userId) return [];

    const { data } = await supabase
      .from('user_cards')
      .select('card:cards!inner(*)')
      .eq('user_id', userId)
      .eq('card.card_type', 'car');

    if (!data) return [];

    return data.map(d => d.card as unknown as CollectibleCard);
  }, [userId]);

  // Statystyki bitew
  const getBattleStats = useCallback(async (): Promise<{ wins: number; losses: number; draws: number }> => {
    if (!userId) return { wins: 0, losses: 0, draws: 0 };

    const { data: battles } = await supabase
      .from('card_battles')
      .select('winner_id, challenger_id, opponent_id')
      .eq('status', 'completed')
      .or(`challenger_id.eq.${userId},opponent_id.eq.${userId}`);

    if (!battles) return { wins: 0, losses: 0, draws: 0 };

    let wins = 0, losses = 0, draws = 0;
    battles.forEach(b => {
      if (b.winner_id === userId) wins++;
      else if (b.winner_id === null) draws++;
      else losses++;
    });

    return { wins, losses, draws };
  }, [userId]);

  return {
    myBattles,
    incomingChallenges,
    loading,
    error,
    createChallenge,
    acceptChallenge,
    declineChallenge,
    getChallengablePlayers,
    getMyCars,
    getChallengesSentThisWeek,
    getBattleStats,
    refetch: fetchBattles,
    getCategoryName,
    getCategoryIcon,
  };
}
