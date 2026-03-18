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

-- tuning_challenges: ranking + open challenges
CREATE INDEX IF NOT EXISTS idx_tuning_challenges_status ON public.tuning_challenges(status);
CREATE INDEX IF NOT EXISTS idx_tuning_challenges_challenger ON public.tuning_challenges(challenger_id);

-- mystery_pack_purchases: order lookup
CREATE INDEX IF NOT EXISTS idx_mystery_purchases_user ON public.mystery_pack_purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_mystery_purchases_status ON public.mystery_pack_purchases(status);
CREATE INDEX IF NOT EXISTS idx_mystery_purchases_order_code ON public.mystery_pack_purchases(order_code);

-- card_orders: order code lookup (PayU webhook)
CREATE INDEX IF NOT EXISTS idx_card_orders_order_code ON public.card_orders(order_code);

-- missions: active missions query
CREATE INDEX IF NOT EXISTS idx_missions_status ON public.missions(status);

-- notifications: user feed
CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id, created_at DESC);

-- Potwierdzenie
SELECT 'Performance indexes created successfully' AS result;
