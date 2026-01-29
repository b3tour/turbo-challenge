-- ============================================
-- TURBO BITWY V2 - PELNY RESET
-- Uruchom w Supabase SQL Editor PRZED deployem nowego kodu
-- ============================================

-- KROK 1: Odejmij XP zdobyte z bitew
-- Kazda wygrana = +100 XP, kazda przegrana = +20 XP

-- 1a. Odejmij XP za wygrane bitwy (100 za kazda)
UPDATE public.users u
SET total_xp = GREATEST(0, u.total_xp - COALESCE((
    SELECT COUNT(*)::int * 100
    FROM public.card_battles cb
    WHERE cb.winner_id = u.id
      AND cb.status = 'completed'
), 0))
WHERE EXISTS (
    SELECT 1 FROM public.card_battles cb
    WHERE cb.winner_id = u.id AND cb.status = 'completed'
);

-- 1b. Odejmij XP za przegrane bitwy (20 za kazda)
UPDATE public.users u
SET total_xp = GREATEST(0, u.total_xp - COALESCE((
    SELECT COUNT(*)::int * 20
    FROM public.card_battles cb
    WHERE cb.status = 'completed'
      AND cb.winner_id IS NOT NULL
      AND cb.winner_id != u.id
      AND (cb.challenger_id = u.id OR cb.opponent_id = u.id)
), 0))
WHERE EXISTS (
    SELECT 1 FROM public.card_battles cb
    WHERE cb.status = 'completed'
      AND cb.winner_id IS NOT NULL
      AND cb.winner_id != u.id
      AND (cb.challenger_id = u.id OR cb.opponent_id = u.id)
);

-- 1c. Przelicz poziomy na podstawie nowego XP
UPDATE public.users
SET level = calculate_level(total_xp);

-- KROK 2: Usun cala historie bitew
DELETE FROM public.card_battles;

-- KROK 3: Usun wszystkie karty graczy
DELETE FROM public.user_cards;

-- KROK 4: Sprawdz wyniki
SELECT id, nick, total_xp, level FROM public.users ORDER BY total_xp DESC LIMIT 20;

-- KROK 5: Po wykonaniu tego skryptu:
-- 1. Wejdz do panelu admina
-- 2. Kliknij przycisk "Pakiet startowy" zeby ponownie rozdac karty
