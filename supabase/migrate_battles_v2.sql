-- ============================================
-- TURBO BITWY V2 - MIGRACJA SCHEMATU
-- Uruchom w Supabase SQL Editor PO uplywie reset_battles_v2.sql
-- ============================================

-- 1. Usun stare kolumny (nie potrzebne w nowym systemie)
ALTER TABLE public.card_battles DROP COLUMN IF EXISTS category;
ALTER TABLE public.card_battles DROP COLUMN IF EXISTS reward_type;

-- 2. Zmien nazwy kolumn kart (teraz losowane przez system)
ALTER TABLE public.card_battles RENAME COLUMN challenger_card_ids TO challenger_dealt_card_ids;
ALTER TABLE public.card_battles RENAME COLUMN opponent_card_ids TO opponent_dealt_card_ids;

-- 3. Dodaj kolumny przydzialu kart do slotow
-- Format: {"power": "card-uuid", "torque": "card-uuid", "speed": "card-uuid"}
ALTER TABLE public.card_battles ADD COLUMN IF NOT EXISTS challenger_slot_assignment JSONB;
ALTER TABLE public.card_battles ADD COLUMN IF NOT EXISTS opponent_slot_assignment JSONB;

-- 4. Dodaj kolumne wynikow rund
-- Format: [{"category":"power","challenger_card_id":"...","opponent_card_id":"...","challenger_value":650,"opponent_value":580,"winner":"challenger"}, ...]
ALTER TABLE public.card_battles ADD COLUMN IF NOT EXISTS round_results JSONB;

-- 5. Zaktualizuj CHECK constraint dla statusu
-- Stary: pending, accepted, completed, expired, declined
-- Nowy: pending, completed, expired, declined (bez accepted)
ALTER TABLE public.card_battles DROP CONSTRAINT IF EXISTS card_battles_status_check;
ALTER TABLE public.card_battles ADD CONSTRAINT card_battles_status_check
    CHECK (status IN ('pending', 'completed', 'expired', 'declined'));

-- 6. challenger_score i opponent_score pozostaja jako INTEGER
-- Zmiana semantyczna: teraz oznaczaja liczbe wygranych rund (0-3)
-- Nie wymaga zmiany schematu

-- 7. Weryfikacja struktury
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'card_battles'
ORDER BY ordinal_position;

-- GOTOWE! Teraz deploy nowego kodu i test.
