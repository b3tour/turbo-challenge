'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { TunedCar, TuningChallenge, TuningCategory, CollectibleCard } from '@/types';
import {
  MOD_DEFINITIONS,
  CATEGORY_WEIGHTS,
  TUNING_WIN_XP,
  getCumulativeBonus,
} from '@/config/tuningConfig';
import { sendUserNotification } from '@/hooks/useAnnouncements';

interface UseTuningProps {
  userId?: string;
}

export function useTuning({ userId }: UseTuningProps) {
  const [tunedCars, setTunedCars] = useState<TunedCar[]>([]);
  const [openChallenges, setOpenChallenges] = useState<TuningChallenge[]>([]);
  const [myChallenges, setMyChallenges] = useState<TuningChallenge[]>([]);
  const [myBattles, setMyBattles] = useState<TuningChallenge[]>([]);
  const [availableXP, setAvailableXP] = useState(0);
  const [totalXP, setTotalXP] = useState(0);
  const [loading, setLoading] = useState(true);

  // Pobierz dostepne XP (total_xp - suma xp_invested)
  const fetchAvailableXP = useCallback(async () => {
    if (!userId) return;

    const { data: user } = await supabase
      .from('users')
      .select('total_xp')
      .eq('id', userId)
      .single();

    const { data: invested } = await supabase
      .from('tuned_cars')
      .select('xp_invested')
      .eq('user_id', userId);

    const userXP = user?.total_xp || 0;
    const totalInvested = (invested || []).reduce((sum, tc) => sum + tc.xp_invested, 0);

    setTotalXP(userXP);
    setAvailableXP(userXP - totalInvested);
  }, [userId]);

  // Pobierz tuningowane auta gracza z JOIN na cards
  const fetchMyTunedCars = useCallback(async () => {
    if (!userId) return;

    const { data, error } = await supabase
      .from('tuned_cars')
      .select('*, card:cards(*)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching tuned cars:', error);
      return;
    }

    setTunedCars((data || []).map(tc => ({
      ...tc,
      card: tc.card as CollectibleCard,
    })));
  }, [userId]);

  // Pobierz otwarte wyzwania (od innych graczy)
  const fetchOpenChallenges = useCallback(async () => {
    if (!userId) return;

    const { data, error } = await supabase
      .from('tuning_challenges')
      .select('*, challenger:users!tuning_challenges_challenger_id_fkey(id, nick, avatar_url)')
      .eq('status', 'open')
      .neq('challenger_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching open challenges:', error);
      return;
    }

    setOpenChallenges((data || []) as unknown as TuningChallenge[]);
  }, [userId]);

  // Pobierz historie bitew gracza
  const fetchMyBattles = useCallback(async () => {
    if (!userId) return;

    const { data, error } = await supabase
      .from('tuning_challenges')
      .select(`
        *,
        challenger:users!tuning_challenges_challenger_id_fkey(id, nick, avatar_url),
        opponent:users!tuning_challenges_opponent_id_fkey(id, nick, avatar_url)
      `)
      .eq('status', 'completed')
      .or(`challenger_id.eq.${userId},opponent_id.eq.${userId}`)
      .order('completed_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('Error fetching my tuning battles:', error);
      return;
    }

    setMyBattles((data || []) as unknown as TuningChallenge[]);
  }, [userId]);

  // Pobierz moje otwarte wyzwania
  const fetchMyChallenges = useCallback(async () => {
    if (!userId) return [];

    const { data, error } = await supabase
      .from('tuning_challenges')
      .select('*, tuned_car:tuned_cars!tuning_challenges_tuned_car_id_fkey(*, card:cards(*))')
      .eq('challenger_id', userId)
      .eq('status', 'open')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching my challenges:', error);
    }

    const result = (data || []) as unknown as TuningChallenge[];
    setMyChallenges(result);
    return result;
  }, [userId]);

  // Laduj wszystkie dane
  const fetchAll = useCallback(async () => {
    setLoading(true);
    await Promise.all([
      fetchAvailableXP(),
      fetchMyTunedCars(),
      fetchOpenChallenges(),
      fetchMyChallenges(),
      fetchMyBattles(),
    ]);
    setLoading(false);
  }, [fetchAvailableXP, fetchMyTunedCars, fetchOpenChallenges, fetchMyChallenges, fetchMyBattles]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // Realtime subscriptions
  useEffect(() => {
    if (!userId) return;

    const challengesChannel = supabase
      .channel(`tuning_challenges_${userId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tuning_challenges' },
        () => {
          fetchOpenChallenges();
          fetchMyChallenges();
          fetchMyBattles();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(challengesChannel);
    };
  }, [userId, fetchOpenChallenges, fetchMyChallenges, fetchMyBattles]);

  // Dodaj auto do tuningu
  const addCarToTuning = async (cardId: string) => {
    if (!userId) return { success: false, error: 'Nie zalogowany' };

    // Sprawdz czy gracz posiada te karte
    const { data: userCard } = await supabase
      .from('user_cards')
      .select('id')
      .eq('user_id', userId)
      .eq('card_id', cardId)
      .limit(1)
      .single();

    if (!userCard) {
      return { success: false, error: 'Nie posiadasz tej karty' };
    }

    // Sprawdz czy karta jest typu 'car'
    const { data: card } = await supabase
      .from('cards')
      .select('card_type')
      .eq('id', cardId)
      .single();

    if (!card || card.card_type !== 'car') {
      return { success: false, error: 'Tylko karty samochodow moga byc tuningowane' };
    }

    // Sprawdz czy to auto juz jest w tuningu
    const existing = tunedCars.find(tc => tc.card_id === cardId);
    if (existing) {
      return { success: false, error: 'To auto jest juz w tuningu' };
    }

    const { error } = await supabase
      .from('tuned_cars')
      .insert({
        user_id: userId,
        card_id: cardId,
        engine_stage: 0,
        turbo_stage: 0,
        weight_stage: 0,
        xp_invested: 0,
      });

    if (error) {
      return { success: false, error: error.message };
    }

    await fetchMyTunedCars();
    return { success: true, error: null };
  };

  // Usun auto z tuningu (XP zwrocone)
  const removeCarFromTuning = async (tunedCarId: string) => {
    if (!userId) return { success: false, error: 'Nie zalogowany' };

    // Sprawdz czy nie ma aktywnego wyzwania z tym autem
    const { data: activeChallenge } = await supabase
      .from('tuning_challenges')
      .select('id')
      .or(`tuned_car_id.eq.${tunedCarId},opponent_tuned_car_id.eq.${tunedCarId}`)
      .eq('status', 'open')
      .limit(1);

    if (activeChallenge && activeChallenge.length > 0) {
      return { success: false, error: 'Anuluj najpierw aktywne wyzwanie z tym autem' };
    }

    // Nullify FK references in completed/cancelled challenges before deleting
    await supabase
      .from('tuning_challenges')
      .update({ tuned_car_id: null })
      .eq('tuned_car_id', tunedCarId)
      .in('status', ['completed', 'cancelled']);

    await supabase
      .from('tuning_challenges')
      .update({ opponent_tuned_car_id: null })
      .eq('opponent_tuned_car_id', tunedCarId)
      .in('status', ['completed', 'cancelled']);

    const { error } = await supabase
      .from('tuned_cars')
      .delete()
      .eq('id', tunedCarId)
      .eq('user_id', userId);

    if (error) {
      return { success: false, error: error.message };
    }

    await Promise.all([fetchMyTunedCars(), fetchAvailableXP()]);
    return { success: true, error: null };
  };

  // Ulepsz mod
  const upgradeMod = async (tunedCarId: string, modType: 'engine' | 'turbo' | 'weight') => {
    if (!userId) return { success: false, error: 'Nie zalogowany' };

    const tunedCar = tunedCars.find(tc => tc.id === tunedCarId);
    if (!tunedCar) return { success: false, error: 'Nie znaleziono auta' };

    const mod = MOD_DEFINITIONS.find(m => m.id === modType);
    if (!mod) return { success: false, error: 'Nieznany typ moda' };

    const stageField = `${modType}_stage` as 'engine_stage' | 'turbo_stage' | 'weight_stage';
    const currentStage = tunedCar[stageField];

    if (currentStage >= 3) {
      return { success: false, error: 'Maksymalny poziom moda' };
    }

    const cost = mod.stages[currentStage].cost;
    if (availableXP < cost) {
      return { success: false, error: `Potrzebujesz ${cost} XP (masz ${availableXP})` };
    }

    const { error } = await supabase
      .from('tuned_cars')
      .update({
        [stageField]: currentStage + 1,
        xp_invested: tunedCar.xp_invested + cost,
      })
      .eq('id', tunedCarId)
      .eq('user_id', userId);

    if (error) {
      return { success: false, error: error.message };
    }

    await Promise.all([fetchMyTunedCars(), fetchAvailableXP()]);
    return { success: true, error: null };
  };

  // Oblicz score auta w danej kategorii (pure function)
  const calculateScore = (tunedCar: TunedCar, category: TuningCategory): number => {
    const card = tunedCar.card;
    if (!card) return 0;

    const weights = CATEGORY_WEIGHTS[category];

    const engineMod = MOD_DEFINITIONS.find(m => m.id === 'engine')!;
    const turboMod = MOD_DEFINITIONS.find(m => m.id === 'turbo')!;
    const weightMod = MOD_DEFINITIONS.find(m => m.id === 'weight')!;

    const hp = (card.car_horsepower || 0) + getCumulativeBonus(engineMod, tunedCar.engine_stage);
    const torque = (card.car_torque || 0) + getCumulativeBonus(turboMod, tunedCar.turbo_stage);
    const speed = (card.car_max_speed || 0) + getCumulativeBonus(weightMod, tunedCar.weight_stage);

    return Math.round(hp * weights.hp + torque * weights.torque + speed * weights.speed);
  };

  // Wystaw wyzwanie
  const postChallenge = async (tunedCarId: string, category: TuningCategory) => {
    if (!userId) return { success: false, error: 'Nie zalogowany' };

    // Sprawdz czy nie masz juz otwartego wyzwania z tym autem
    const { data: existing } = await supabase
      .from('tuning_challenges')
      .select('id')
      .eq('challenger_id', userId)
      .eq('tuned_car_id', tunedCarId)
      .eq('status', 'open')
      .limit(1);

    if (existing && existing.length > 0) {
      return { success: false, error: 'Masz juz otwarte wyzwanie z tym autem' };
    }

    const { error } = await supabase
      .from('tuning_challenges')
      .insert({
        challenger_id: userId,
        tuned_car_id: tunedCarId,
        category,
        status: 'open',
      });

    if (error) {
      return { success: false, error: error.message };
    }

    await Promise.all([fetchOpenChallenges(), fetchMyChallenges()]);
    return { success: true, error: null };
  };

  // Anuluj wyzwanie
  const cancelChallenge = async (challengeId: string) => {
    if (!userId) return { success: false, error: 'Nie zalogowany' };

    const { error } = await supabase
      .from('tuning_challenges')
      .update({ status: 'cancelled' })
      .eq('id', challengeId)
      .eq('challenger_id', userId)
      .eq('status', 'open');

    if (error) {
      return { success: false, error: error.message };
    }

    await Promise.all([fetchOpenChallenges(), fetchMyChallenges()]);
    return { success: true, error: null };
  };

  // Podejmij wyzwanie
  const acceptChallenge = async (challengeId: string, myTunedCarId: string) => {
    if (!userId) return { success: false, error: 'Nie zalogowany' };

    // 1. Pobierz wyzwanie
    const { data: challenge, error: challengeError } = await supabase
      .from('tuning_challenges')
      .select('*')
      .eq('id', challengeId)
      .eq('status', 'open')
      .single();

    if (challengeError || !challenge) {
      return { success: false, error: 'Wyzwanie nie istnieje lub jest juz zamkniete' };
    }

    if (challenge.challenger_id === userId) {
      return { success: false, error: 'Nie mozesz przyjac wlasnego wyzwania' };
    }

    // 2. Pobierz oba tuned_cars z kartami
    const { data: challengerTC } = await supabase
      .from('tuned_cars')
      .select('*, card:cards(*)')
      .eq('id', challenge.tuned_car_id)
      .single();

    const { data: opponentTC } = await supabase
      .from('tuned_cars')
      .select('*, card:cards(*)')
      .eq('id', myTunedCarId)
      .single();

    if (!challengerTC || !opponentTC) {
      return { success: false, error: 'Nie znaleziono jednego z aut' };
    }

    const challengerCar: TunedCar = { ...challengerTC, card: challengerTC.card as CollectibleCard };
    const opponentCar: TunedCar = { ...opponentTC, card: opponentTC.card as CollectibleCard };

    // 3. Oblicz scores
    const category = challenge.category as TuningCategory;
    const challengerScore = calculateScore(challengerCar, category);
    const opponentScore = calculateScore(opponentCar, category);

    // 4. Okresl zwyciezce
    let winnerId: string | null = null;
    if (challengerScore > opponentScore) {
      winnerId = challenge.challenger_id;
    } else if (opponentScore > challengerScore) {
      winnerId = userId;
    }
    // Remis: winnerId = null

    // 5. Update challenge
    const { error: updateError } = await supabase
      .from('tuning_challenges')
      .update({
        opponent_id: userId,
        opponent_tuned_car_id: myTunedCarId,
        challenger_score: challengerScore,
        opponent_score: opponentScore,
        winner_id: winnerId,
        status: 'completed',
        completed_at: new Date().toISOString(),
      })
      .eq('id', challengeId);

    if (updateError) {
      return { success: false, error: updateError.message };
    }

    // 6. Przyznaj XP zwyciezcy
    if (winnerId) {
      await supabase.rpc('add_xp', { user_id: winnerId, xp_amount: TUNING_WIN_XP });
    }

    // 7. Pobierz dane graczy do powiadomien
    const { data: challengerUser } = await supabase
      .from('users')
      .select('nick')
      .eq('id', challenge.challenger_id)
      .single();

    const { data: opponentUser } = await supabase
      .from('users')
      .select('nick')
      .eq('id', userId)
      .single();

    const challengerNick = challengerUser?.nick || 'Gracz';
    const opponentNick = opponentUser?.nick || 'Gracz';

    // 8. Wyslij powiadomienia
    if (winnerId === challenge.challenger_id) {
      // Challenger wygral
      await sendUserNotification(
        challenge.challenger_id,
        'Wygrana w tuningu!',
        `Pokonales ${opponentNick} w ${CATEGORY_LABELS_SIMPLE[category]}! (+${TUNING_WIN_XP} XP)`,
        'tuning_result' as 'system'
      );
      await sendUserNotification(
        userId,
        'Przegrana w tuningu',
        `${challengerNick} pokonał Cie w ${CATEGORY_LABELS_SIMPLE[category]}.`,
        'tuning_result' as 'system'
      );
    } else if (winnerId === userId) {
      // Opponent (accepter) wygral
      await sendUserNotification(
        userId,
        'Wygrana w tuningu!',
        `Pokonales ${challengerNick} w ${CATEGORY_LABELS_SIMPLE[category]}! (+${TUNING_WIN_XP} XP)`,
        'tuning_result' as 'system'
      );
      await sendUserNotification(
        challenge.challenger_id,
        'Przegrana w tuningu',
        `${opponentNick} pokonał Cie w ${CATEGORY_LABELS_SIMPLE[category]}.`,
        'tuning_result' as 'system'
      );
    } else {
      // Remis
      await sendUserNotification(
        challenge.challenger_id,
        'Remis w tuningu!',
        `Remis z ${opponentNick} w ${CATEGORY_LABELS_SIMPLE[category]}.`,
        'tuning_result' as 'system'
      );
      await sendUserNotification(
        userId,
        'Remis w tuningu!',
        `Remis z ${challengerNick} w ${CATEGORY_LABELS_SIMPLE[category]}.`,
        'tuning_result' as 'system'
      );
    }

    // 9. Odswiez dane
    await Promise.all([fetchOpenChallenges(), fetchMyBattles(), fetchAvailableXP()]);

    return {
      success: true,
      error: null,
      result: {
        challengerScore,
        opponentScore,
        winnerId,
        challengerCar,
        opponentCar,
        category,
      },
    };
  };

  return {
    tunedCars,
    openChallenges,
    myChallenges,
    myBattles,
    availableXP,
    totalXP,
    loading,
    addCarToTuning,
    removeCarFromTuning,
    upgradeMod,
    calculateScore,
    postChallenge,
    cancelChallenge,
    acceptChallenge,
    fetchMyChallenges,
    refresh: fetchAll,
  };
}

// Prosta mapa nazw kategorii do powiadomien
const CATEGORY_LABELS_SIMPLE: Record<TuningCategory, string> = {
  drag: 'Drag Race',
  hill_climb: 'Hill Climb',
  track: 'Track Day',
  time_attack: 'Time Attack',
};
