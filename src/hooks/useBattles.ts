'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { CardBattle, BattleRoundCategory, BattleSlotAssignment, BattleRoundResult, CollectibleCard, User } from '@/types';
import { sendUserNotification } from '@/hooks/useAnnouncements';
import { BATTLE_BADGES, BattleStatsForBadges } from '@/config/battleBadges';

interface UseBattlesOptions {
  userId?: string;
}

interface BattleWithDetails extends CardBattle {
  challenger?: User;
  opponent?: User;
  challenger_cards?: CollectibleCard[];
  opponent_cards?: CollectibleCard[];
}

// Nazwa kategorii rundy po polsku
export function getCategoryName(category: BattleRoundCategory): string {
  switch (category) {
    case 'power': return 'Moc (KM)';
    case 'torque': return 'Moment (Nm)';
    case 'speed': return 'Prędkość (km/h)';
  }
}

// Ikona kategorii rundy
export function getCategoryIcon(category: BattleRoundCategory): string {
  switch (category) {
    case 'power': return '⚡';
    case 'torque': return '🔧';
    case 'speed': return '💨';
  }
}

// Pobierz wartość statu karty dla danej kategorii
function getCardStatValue(card: CollectibleCard, category: BattleRoundCategory): number {
  switch (category) {
    case 'power': return card.car_horsepower || 0;
    case 'torque': return card.car_torque || 0;
    case 'speed': return card.car_max_speed || 0;
  }
}

// Rozstrzygnij 3 rundy bitwy (pure function)
function resolveRounds(
  challengerSlots: BattleSlotAssignment,
  opponentSlots: BattleSlotAssignment,
  allCards: Map<string, CollectibleCard>
): { results: BattleRoundResult[]; challengerWins: number; opponentWins: number } {
  const categories: BattleRoundCategory[] = ['power', 'torque', 'speed'];
  const results: BattleRoundResult[] = [];
  let challengerWins = 0;
  let opponentWins = 0;

  for (const cat of categories) {
    const cCard = allCards.get(challengerSlots[cat]);
    const oCard = allCards.get(opponentSlots[cat]);

    const cValue = cCard ? getCardStatValue(cCard, cat) : 0;
    const oValue = oCard ? getCardStatValue(oCard, cat) : 0;

    let winner: 'challenger' | 'opponent' | 'draw';
    if (cValue > oValue) {
      winner = 'challenger';
      challengerWins++;
    } else if (oValue > cValue) {
      winner = 'opponent';
      opponentWins++;
    } else {
      winner = 'draw';
    }

    results.push({
      category: cat,
      challenger_card_id: challengerSlots[cat],
      opponent_card_id: opponentSlots[cat],
      challenger_value: cValue,
      opponent_value: oValue,
      winner,
    });
  }

  return { results, challengerWins, opponentWins };
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

      // Zbierz unikalne ID kart ze wszystkich bitew
      const allCardIds = new Set<string>();
      (battles || []).forEach(battle => {
        (battle.challenger_dealt_card_ids || []).forEach((id: string) => allCardIds.add(id));
        (battle.opponent_dealt_card_ids || []).forEach((id: string) => allCardIds.add(id));
      });

      // Pobierz wszystkie karty jednym zapytaniem (zamiast N+1)
      let cardsMap = new Map<string, CollectibleCard>();
      if (allCardIds.size > 0) {
        const { data: cards } = await supabase
          .from('cards')
          .select('*')
          .in('id', Array.from(allCardIds));
        (cards || []).forEach(card => cardsMap.set(card.id, card as CollectibleCard));
      }

      // Przypisz karty do bitew
      const battlesWithCards: BattleWithDetails[] = (battles || []).map(battle => {
        const challengerCards = (battle.challenger_dealt_card_ids || [])
          .map((id: string) => cardsMap.get(id))
          .filter(Boolean) as CollectibleCard[];
        const opponentCards = (battle.opponent_dealt_card_ids || [])
          .map((id: string) => cardsMap.get(id))
          .filter(Boolean) as CollectibleCard[];

        return {
          ...battle,
          challenger_cards: challengerCards,
          opponent_cards: opponentCards,
        } as BattleWithDetails;
      });

      // Rozdziel na historię i przychodzące wyzwania
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

  // Wylosuj 3 losowe karty samochodów z kolekcji gracza
  const dealRandomCards = useCallback(async (targetUserId: string): Promise<CollectibleCard[]> => {
    const { data } = await supabase
      .from('user_cards')
      .select('card:cards!inner(*)')
      .eq('user_id', targetUserId)
      .eq('card.card_type', 'car');

    if (!data || data.length < 3) {
      throw new Error('Niewystarczająca liczba kart samochodów (minimum 3)');
    }

    const cards = data.map(d => d.card as unknown as CollectibleCard);

    // Fisher-Yates shuffle
    const shuffled = [...cards];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    return shuffled.slice(0, 3);
  }, []);

  // Utwórz nowe wyzwanie (z wylosowanymi kartami i przydziałem slotów)
  const createChallenge = useCallback(async (
    opponentId: string,
    dealtCards: CollectibleCard[],
    slotAssignment: BattleSlotAssignment
  ): Promise<{ success: boolean; error?: string; battle?: CardBattle }> => {
    if (!userId) return { success: false, error: 'Nie jesteś zalogowany' };

    // Sprawdź limit tygodniowy
    const sentThisWeek = await getChallengesSentThisWeek();
    if (sentThisWeek >= 3) {
      return { success: false, error: 'Osiągnąłeś limit 3 wyzwań na tydzień' };
    }

    // Sprawdź czy nie wyzywasz siebie
    if (opponentId === userId) {
      return { success: false, error: 'Nie możesz wyzwać samego siebie' };
    }

    // Waliduj przydział — wszystkie 3 karty z dealt muszą być w slotach
    const dealtIds = new Set(dealtCards.map(c => c.id));
    const assignedIds = [slotAssignment.power, slotAssignment.torque, slotAssignment.speed];
    const uniqueAssigned = new Set(assignedIds);

    if (uniqueAssigned.size !== 3) {
      return { success: false, error: 'Każdy slot musi mieć inną kartę' };
    }
    for (const id of assignedIds) {
      if (!dealtIds.has(id)) {
        return { success: false, error: 'Przydzielona karta nie jest z wylosowanego zestawu' };
      }
    }

    // Oblicz datę wygaśnięcia (7 dni)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const { data, error: insertError } = await supabase
      .from('card_battles')
      .insert({
        challenger_id: userId,
        opponent_id: opponentId,
        challenger_dealt_card_ids: dealtCards.map(c => c.id),
        challenger_slot_assignment: slotAssignment,
        status: 'pending',
        expires_at: expiresAt.toISOString(),
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error creating challenge:', insertError);
      return { success: false, error: insertError.message };
    }

    // Wyślij powiadomienie do przeciwnika
    const { data: challengerData } = await supabase
      .from('users')
      .select('nick')
      .eq('id', userId)
      .single();

    const challengerNick = challengerData?.nick || 'Gracz';

    await sendUserNotification(
      opponentId,
      'Nowe wyzwanie!',
      `${challengerNick} wyzwał Cię na Turbo Bitwę! 3 rundy: Moc, Moment, Prędkość. Masz 7 dni na odpowiedź.`,
      'battle_challenge',
      { battle_id: data.id, challenger_nick: challengerNick }
    );

    await fetchBattles();
    return { success: true, battle: data };
  }, [userId, getChallengesSentThisWeek, fetchBattles]);

  // Sprawdz i przydziel odznaki bitewne (karty achievement) po kazdej bitwie
  const checkAndAwardBattleBadges = useCallback(async (targetUserId: string) => {
    try {
      // Pobierz statystyki gracza
      const { data: battles } = await supabase
        .from('card_battles')
        .select('winner_id, challenger_id, opponent_id, challenger_score, opponent_score')
        .eq('status', 'completed')
        .or(`challenger_id.eq.${targetUserId},opponent_id.eq.${targetUserId}`);

      if (!battles) return;

      let wins = 0, losses = 0, draws = 0;
      let hasPerfectWin = false;

      battles.forEach(b => {
        if (b.winner_id === targetUserId) {
          wins++;
          const isChallenger = b.challenger_id === targetUserId;
          const myScore = isChallenger ? b.challenger_score : b.opponent_score;
          const theirScore = isChallenger ? b.opponent_score : b.challenger_score;
          if (myScore === 3 && theirScore === 0) hasPerfectWin = true;
        } else if (b.winner_id === null) {
          draws++;
        } else {
          losses++;
        }
      });

      const stats: BattleStatsForBadges = {
        wins, losses, draws,
        totalBattles: wins + losses + draws,
        hasPerfectWin,
      };

      // Pobierz karty achievement gracza (zeby nie dawac duplikatow)
      const { data: ownedAchievements } = await supabase
        .from('user_cards')
        .select('card:cards!inner(name, card_type)')
        .eq('user_id', targetUserId)
        .eq('card.card_type', 'achievement');

      const ownedNames = new Set(
        (ownedAchievements || []).map(uc => (uc.card as unknown as { name: string }).name)
      );

      // Sprawdz kazda odznake
      for (const badge of BATTLE_BADGES) {
        if (!badge.condition(stats)) continue;
        if (ownedNames.has(badge.name)) continue;

        // Szukaj karty w DB po nazwie
        const { data: cardData } = await supabase
          .from('cards')
          .select('id')
          .eq('name', badge.name)
          .eq('card_type', 'achievement')
          .eq('is_active', true)
          .single();

        if (!cardData) continue;

        // Przydziel karte
        await supabase.from('user_cards').insert({
          user_id: targetUserId,
          card_id: cardData.id,
          obtained_from: 'achievement',
        });

        // Wyslij powiadomienie
        await sendUserNotification(
          targetUserId,
          'Nowa odznaka bitewna!',
          `Zdobyłeś odznakę "${badge.name}" — ${badge.description}!`,
          'achievement',
          { badge_id: badge.id, badge_name: badge.name }
        );
      }
    } catch (e) {
      console.error('Error checking battle badges:', e);
    }
  }, []);

  // Akceptuj wyzwanie (z wylosowanymi kartami i przydziałem slotów)
  const acceptChallenge = useCallback(async (
    battleId: string,
    dealtCards: CollectibleCard[],
    slotAssignment: BattleSlotAssignment
  ): Promise<{ success: boolean; error?: string; results?: BattleRoundResult[]; winnerId?: string | null }> => {
    if (!userId) return { success: false, error: 'Nie jesteś zalogowany' };

    // Pobierz bitwę
    const { data: battle, error: fetchError } = await supabase
      .from('card_battles')
      .select('*')
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

    // Waliduj przydział
    const dealtIds = new Set(dealtCards.map(c => c.id));
    const assignedIds = [slotAssignment.power, slotAssignment.torque, slotAssignment.speed];
    const uniqueAssigned = new Set(assignedIds);

    if (uniqueAssigned.size !== 3) {
      return { success: false, error: 'Każdy slot musi mieć inną kartę' };
    }
    for (const id of assignedIds) {
      if (!dealtIds.has(id)) {
        return { success: false, error: 'Przydzielona karta nie jest z wylosowanego zestawu' };
      }
    }

    // Pobierz karty challengera
    const challengerSlots = battle.challenger_slot_assignment as BattleSlotAssignment;
    const allCardIds = [
      ...battle.challenger_dealt_card_ids,
      ...dealtCards.map(c => c.id),
    ];

    const { data: allCardsData } = await supabase
      .from('cards')
      .select('*')
      .in('id', allCardIds);

    if (!allCardsData) {
      return { success: false, error: 'Błąd pobierania kart' };
    }

    const cardsMap = new Map<string, CollectibleCard>();
    allCardsData.forEach(card => cardsMap.set(card.id, card as CollectibleCard));

    // Rozstrzygnij 3 rundy
    const { results, challengerWins, opponentWins } = resolveRounds(
      challengerSlots,
      slotAssignment,
      cardsMap
    );

    // Określ zwycięzcę
    let winnerId: string | null = null;
    if (challengerWins > opponentWins) {
      winnerId = battle.challenger_id;
    } else if (opponentWins > challengerWins) {
      winnerId = battle.opponent_id;
    }

    // Aktualizuj bitwę
    const { error: updateError } = await supabase
      .from('card_battles')
      .update({
        opponent_dealt_card_ids: dealtCards.map(c => c.id),
        opponent_slot_assignment: slotAssignment,
        round_results: results,
        status: 'completed',
        winner_id: winnerId,
        challenger_score: challengerWins,
        opponent_score: opponentWins,
        completed_at: new Date().toISOString(),
      })
      .eq('id', battleId);

    if (updateError) {
      return { success: false, error: updateError.message };
    }

    // Przyznaj XP (wygrana: 30, przegrana: 0, remis: 10)
    if (winnerId) {
      await supabase.rpc('add_xp', { user_id: winnerId, xp_amount: 30 });
    } else {
      // Remis — obaj +10 XP
      await supabase.rpc('add_xp', { user_id: battle.challenger_id, xp_amount: 10 });
      await supabase.rpc('add_xp', { user_id: battle.opponent_id, xp_amount: 10 });
    }

    // Sprawdz i przydziel odznaki bitewne obu graczom
    await checkAndAwardBattleBadges(battle.challenger_id);
    await checkAndAwardBattleBadges(battle.opponent_id);

    // Wyślij powiadomienia
    const { data: usersData } = await supabase
      .from('users')
      .select('id, nick')
      .in('id', [battle.challenger_id, battle.opponent_id]);

    const challenger = usersData?.find(u => u.id === battle.challenger_id);
    const opponent = usersData?.find(u => u.id === battle.opponent_id);
    const scoreText = `${challengerWins}-${opponentWins}`;

    if (winnerId) {
      const winnerNick = winnerId === battle.challenger_id ? challenger?.nick : opponent?.nick;
      const loserNick = winnerId === battle.challenger_id ? opponent?.nick : challenger?.nick;
      const loserId = winnerId === battle.challenger_id ? battle.opponent_id : battle.challenger_id;

      await sendUserNotification(
        winnerId,
        'Wygrana w Turbo Bitwie!',
        `Pokonałeś ${loserNick}! Wynik rund: ${scoreText}. +30 XP!`,
        'battle_result',
        { battle_id: battleId, result: 'win', xp_gained: 30 }
      );

      await sendUserNotification(
        loserId,
        'Przegrana w Turbo Bitwie',
        `${winnerNick} wygrał bitwę. Wynik rund: ${scoreText}.`,
        'battle_result',
        { battle_id: battleId, result: 'loss', xp_gained: 0 }
      );
    } else {
      await sendUserNotification(
        battle.challenger_id,
        'Remis w Turbo Bitwie!',
        `Bitwa z ${opponent?.nick} zakończyła się remisem! Wynik rund: ${scoreText}. +10 XP.`,
        'battle_result',
        { battle_id: battleId, result: 'draw', xp_gained: 10 }
      );

      await sendUserNotification(
        battle.opponent_id,
        'Remis w Turbo Bitwie!',
        `Bitwa z ${challenger?.nick} zakończyła się remisem! Wynik rund: ${scoreText}. +10 XP.`,
        'battle_result',
        { battle_id: battleId, result: 'draw', xp_gained: 10 }
      );
    }

    await fetchBattles();
    return { success: true, results, winnerId };
  }, [userId, fetchBattles, checkAndAwardBattleBadges]);

  // Odrzuć wyzwanie
  const declineChallenge = useCallback(async (battleId: string): Promise<{ success: boolean; error?: string }> => {
    if (!userId) return { success: false, error: 'Nie jesteś zalogowany' };

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

  // Pobierz listę graczy do wyzwania (min. 3 karty samochodów)
  const getChallengablePlayers = useCallback(async (limit: number = 20): Promise<User[]> => {
    if (!userId) return [];

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

    // Filtruj tych z min. 3 kartami (było 2, teraz 3 bo potrzeba 3 do bitwy)
    const eligibleUserIds = Object.entries(cardCounts)
      .filter(([_, count]) => count >= 3)
      .map(([id]) => id);

    if (eligibleUserIds.length === 0) return [];

    const { data: users } = await supabase
      .from('users')
      .select('id, nick, avatar_url, total_xp, level')
      .in('id', eligibleUserIds)
      .order('total_xp', { ascending: false })
      .limit(limit);

    return (users || []) as User[];
  }, [userId]);

  // Statystyki bitew (rozszerzone o hasPerfectWin i totalBattles)
  const getBattleStats = useCallback(async (): Promise<BattleStatsForBadges> => {
    if (!userId) return { wins: 0, losses: 0, draws: 0, totalBattles: 0, hasPerfectWin: false };

    const { data: battles } = await supabase
      .from('card_battles')
      .select('winner_id, challenger_id, opponent_id, challenger_score, opponent_score')
      .eq('status', 'completed')
      .or(`challenger_id.eq.${userId},opponent_id.eq.${userId}`);

    if (!battles) return { wins: 0, losses: 0, draws: 0, totalBattles: 0, hasPerfectWin: false };

    let wins = 0, losses = 0, draws = 0;
    let hasPerfectWin = false;

    battles.forEach(b => {
      if (b.winner_id === userId) {
        wins++;
        // Sprawdz czy 3-0 sweep
        const isChallenger = b.challenger_id === userId;
        const myScore = isChallenger ? b.challenger_score : b.opponent_score;
        const theirScore = isChallenger ? b.opponent_score : b.challenger_score;
        if (myScore === 3 && theirScore === 0) {
          hasPerfectWin = true;
        }
      } else if (b.winner_id === null) {
        draws++;
      } else {
        losses++;
      }
    });

    const totalBattles = wins + losses + draws;
    return { wins, losses, draws, totalBattles, hasPerfectWin };
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
    dealRandomCards,
    getChallengesSentThisWeek,
    getBattleStats,
    checkAndAwardBattleBadges,
    refetch: fetchBattles,
  };
}
