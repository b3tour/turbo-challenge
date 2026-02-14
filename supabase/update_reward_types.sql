-- Migracja: aktualizacja reward_type w tabeli rewards
-- Zamień 'donation' na 'cards' w istniejących nagrodach
UPDATE public.rewards SET reward_type = 'cards' WHERE reward_type = 'donation';

-- Ustaw domyślny typ 'xp' dla nagród bez ustawionego typu
UPDATE public.rewards SET reward_type = 'xp' WHERE reward_type IS NULL;
