-- =====================================================
-- TURBO CHALLENGE - Indeksy wydajnościowe przed launchem
-- Uruchom w SQL Editor w panelu Supabase
-- Data: 2026-03-16
-- =====================================================

-- user_cards: najczęstszy query (każdy gracz ładuje swoje karty)
CREATE INDEX IF NOT EXISTS idx_user_cards_user_id ON public.user_cards(user_id);
CREATE INDEX IF NOT EXISTS idx_user_cards_card_id ON public.user_cards(card_id);
CREATE INDEX IF NOT EXISTS idx_user_cards_user_obtained ON public.user_cards(user_id, obtained_at DESC);

-- cards: filtrowanie aktywnych kart (każde wejście na /cards)
CREATE INDEX IF NOT EXISTS idx_cards_is_active ON public.cards(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_cards_rarity ON public.cards(rarity);
CREATE INDEX IF NOT EXISTS idx_cards_card_type ON public.cards(card_type);

-- submissions: composite index dla najczęstszego query (user + mission + status)
CREATE INDEX IF NOT EXISTS idx_submissions_user_mission ON public.submissions(user_id, mission_id);
CREATE INDEX IF NOT EXISTS idx_submissions_user_status ON public.submissions(user_id, status);
-- speedrun ranking query
CREATE INDEX IF NOT EXISTS idx_submissions_mission_time ON public.submissions(mission_id, quiz_time_ms ASC) WHERE quiz_time_ms IS NOT NULL;

-- card_orders: query po user_id + status (ranking donacji)
CREATE INDEX IF NOT EXISTS idx_card_orders_user_id ON public.card_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_card_orders_status ON public.card_orders(status);

-- card_battles: query po challenger/opponent
CREATE INDEX IF NOT EXISTS idx_card_battles_challenger ON public.card_battles(challenger_id);
CREATE INDEX IF NOT EXISTS idx_card_battles_opponent ON public.card_battles(opponent_id);
CREATE INDEX IF NOT EXISTS idx_card_battles_status ON public.card_battles(status);

-- users: ranking donacji
CREATE INDEX IF NOT EXISTS idx_users_donation_total ON public.users(donation_total DESC) WHERE donation_total > 0;

-- announcements: aktywne ogłoszenia
CREATE INDEX IF NOT EXISTS idx_announcements_active ON public.announcements(is_active) WHERE is_active = true;

-- Potwierdzenie
SELECT 'Performance indexes created successfully' AS result;
