-- ============================================
-- STREFA TUNINGU - Migracja tabel
-- Uruchom w Supabase SQL Editor
-- ============================================

-- 1. Tabela tuned_cars - auta przydzielone do tuningu
CREATE TABLE public.tuned_cars (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  card_id UUID NOT NULL REFERENCES public.cards(id) ON DELETE CASCADE,
  engine_stage INTEGER DEFAULT 0 NOT NULL CHECK (engine_stage BETWEEN 0 AND 3),
  turbo_stage INTEGER DEFAULT 0 NOT NULL CHECK (turbo_stage BETWEEN 0 AND 3),
  weight_stage INTEGER DEFAULT 0 NOT NULL CHECK (weight_stage BETWEEN 0 AND 3),
  xp_invested INTEGER DEFAULT 0 NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Indeksy
CREATE INDEX idx_tuned_cars_user_id ON public.tuned_cars(user_id);
CREATE INDEX idx_tuned_cars_card_id ON public.tuned_cars(card_id);

-- RLS
ALTER TABLE public.tuned_cars ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Wszyscy widza tuned_cars" ON public.tuned_cars
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Gracz dodaje swoje tuned_cars" ON public.tuned_cars
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE POLICY "Gracz aktualizuje swoje tuned_cars" ON public.tuned_cars
  FOR UPDATE TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Gracz usuwa swoje tuned_cars" ON public.tuned_cars
  FOR DELETE TO authenticated USING (user_id = auth.uid());

-- 2. Tabela tuning_challenges - wyzwania tuningu
CREATE TABLE public.tuning_challenges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  challenger_id UUID NOT NULL REFERENCES public.users(id),
  tuned_car_id UUID NOT NULL REFERENCES public.tuned_cars(id),
  category TEXT NOT NULL CHECK (category IN ('drag', 'hill_climb', 'track', 'time_attack')),
  status TEXT DEFAULT 'open' NOT NULL CHECK (status IN ('open', 'completed', 'cancelled')),
  opponent_id UUID REFERENCES public.users(id),
  opponent_tuned_car_id UUID REFERENCES public.tuned_cars(id),
  challenger_score INTEGER,
  opponent_score INTEGER,
  winner_id UUID REFERENCES public.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  completed_at TIMESTAMPTZ
);

-- Indeksy
CREATE INDEX idx_tuning_challenges_challenger ON public.tuning_challenges(challenger_id);
CREATE INDEX idx_tuning_challenges_opponent ON public.tuning_challenges(opponent_id);
CREATE INDEX idx_tuning_challenges_status ON public.tuning_challenges(status);

-- RLS
ALTER TABLE public.tuning_challenges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Wszyscy widza tuning_challenges" ON public.tuning_challenges
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Gracz tworzy wyzwanie" ON public.tuning_challenges
  FOR INSERT TO authenticated WITH CHECK (challenger_id = auth.uid());

CREATE POLICY "Gracz aktualizuje wyzwanie" ON public.tuning_challenges
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Gracz anuluje swoje otwarte wyzwanie" ON public.tuning_challenges
  FOR DELETE TO authenticated USING (challenger_id = auth.uid() AND status = 'open');

-- 3. Dodaj typ powiadomienia tuning_result
ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS notifications_type_check;
ALTER TABLE public.notifications ADD CONSTRAINT notifications_type_check
  CHECK (type IN (
    'xp_gain', 'level_up', 'achievement', 'mission_approved', 'mission_rejected',
    'card_received', 'battle_challenge', 'battle_result', 'system',
    'tuning_result'
  ));

-- Weryfikacja
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public' AND table_name IN ('tuned_cars', 'tuning_challenges');
