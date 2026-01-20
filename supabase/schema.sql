-- =====================================================
-- TURBO CHALLENGE - Schemat bazy danych Supabase
-- =====================================================
-- Uruchom ten skrypt w SQL Editor w panelu Supabase

-- Włącz rozszerzenie UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- TABELA: users (profile użytkowników)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    nick TEXT UNIQUE NOT NULL,
    phone TEXT,
    avatar_url TEXT,
    total_xp INTEGER DEFAULT 0 NOT NULL,
    level INTEGER DEFAULT 1 NOT NULL,
    class TEXT DEFAULT 'solo' CHECK (class IN ('solo', 'crew')),
    crew_id UUID,
    is_admin BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Indeksy dla szybkich wyszukiwań
CREATE INDEX IF NOT EXISTS idx_users_nick ON public.users(nick);
CREATE INDEX IF NOT EXISTS idx_users_total_xp ON public.users(total_xp DESC);
CREATE INDEX IF NOT EXISTS idx_users_level ON public.users(level);

-- =====================================================
-- TABELA: missions (misje do wykonania)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.missions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    xp_reward INTEGER NOT NULL DEFAULT 50,
    type TEXT NOT NULL CHECK (type IN ('qr_code', 'photo', 'quiz', 'gps', 'manual')),
    location_name TEXT,
    location_lat DECIMAL(10, 8),
    location_lng DECIMAL(11, 8),
    location_radius INTEGER DEFAULT 50, -- w metrach
    qr_code_value TEXT UNIQUE,
    quiz_data JSONB, -- dane quizu w formacie JSON
    photo_requirements TEXT,
    start_date TIMESTAMPTZ,
    end_date TIMESTAMPTZ,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'scheduled')),
    required_level INTEGER DEFAULT 1,
    max_completions INTEGER, -- NULL = nieograniczone
    image_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Indeksy
CREATE INDEX IF NOT EXISTS idx_missions_status ON public.missions(status);
CREATE INDEX IF NOT EXISTS idx_missions_type ON public.missions(type);
CREATE INDEX IF NOT EXISTS idx_missions_qr_code ON public.missions(qr_code_value);

-- =====================================================
-- TABELA: submissions (zgłoszenia wykonania misji)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.submissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    mission_id UUID NOT NULL REFERENCES public.missions(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    photo_url TEXT,
    quiz_score INTEGER, -- procent poprawnych odpowiedzi
    gps_lat DECIMAL(10, 8),
    gps_lng DECIMAL(11, 8),
    admin_notes TEXT,
    reviewed_by UUID REFERENCES public.users(id),
    reviewed_at TIMESTAMPTZ,
    xp_awarded INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Indeksy
CREATE INDEX IF NOT EXISTS idx_submissions_user ON public.submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_submissions_mission ON public.submissions(mission_id);
CREATE INDEX IF NOT EXISTS idx_submissions_status ON public.submissions(status);

-- =====================================================
-- TABELA: achievements (odznaki)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.achievements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    icon TEXT NOT NULL,
    condition_type TEXT NOT NULL CHECK (condition_type IN ('xp_total', 'missions_count', 'mission_type_count', 'level', 'special')),
    condition_value INTEGER NOT NULL,
    condition_extra TEXT, -- np. typ misji dla mission_type_count
    xp_bonus INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- =====================================================
-- TABELA: user_achievements (odznaki użytkowników)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.user_achievements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    achievement_id UUID NOT NULL REFERENCES public.achievements(id) ON DELETE CASCADE,
    earned_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(user_id, achievement_id)
);

-- =====================================================
-- TABELA: notifications (powiadomienia)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('xp_gain', 'level_up', 'achievement', 'mission_approved', 'mission_rejected', 'system')),
    read BOOLEAN DEFAULT FALSE NOT NULL,
    data JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON public.notifications(read);

-- =====================================================
-- FUNKCJE I TRIGGERY
-- =====================================================

-- Funkcja do aktualizacji updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger dla users
DROP TRIGGER IF EXISTS update_users_updated_at ON public.users;
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON public.users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Funkcja do obliczania poziomu na podstawie XP
CREATE OR REPLACE FUNCTION calculate_level(xp INTEGER)
RETURNS INTEGER AS $$
BEGIN
    IF xp >= 12001 THEN RETURN 10;
    ELSIF xp >= 9001 THEN RETURN 9;
    ELSIF xp >= 7001 THEN RETURN 8;
    ELSIF xp >= 5001 THEN RETURN 7;
    ELSIF xp >= 3501 THEN RETURN 6;
    ELSIF xp >= 2001 THEN RETURN 5;
    ELSIF xp >= 1001 THEN RETURN 4;
    ELSIF xp >= 501 THEN RETURN 3;
    ELSIF xp >= 201 THEN RETURN 2;
    ELSE RETURN 1;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Funkcja do dodawania XP użytkownikowi (wywoływana przez RPC)
CREATE OR REPLACE FUNCTION add_user_xp(p_user_id UUID, p_xp_amount INTEGER)
RETURNS void AS $$
DECLARE
    v_new_xp INTEGER;
    v_old_level INTEGER;
    v_new_level INTEGER;
BEGIN
    -- Pobierz aktualny XP i poziom
    SELECT total_xp, level INTO v_new_xp, v_old_level
    FROM public.users
    WHERE id = p_user_id;

    -- Dodaj XP
    v_new_xp := v_new_xp + p_xp_amount;

    -- Oblicz nowy poziom
    v_new_level := calculate_level(v_new_xp);

    -- Zaktualizuj użytkownika
    UPDATE public.users
    SET total_xp = v_new_xp, level = v_new_level
    WHERE id = p_user_id;

    -- Jeśli awansował, utwórz powiadomienie
    IF v_new_level > v_old_level THEN
        INSERT INTO public.notifications (user_id, title, message, type, data)
        VALUES (
            p_user_id,
            'Nowy poziom!',
            'Gratulacje! Awansowałeś na poziom ' || v_new_level,
            'level_up',
            jsonb_build_object('old_level', v_old_level, 'new_level', v_new_level)
        );
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Włącz RLS na wszystkich tabelach
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.missions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Polityki dla users
CREATE POLICY "Users can view all users" ON public.users
    FOR SELECT USING (true);

CREATE POLICY "Users can insert own profile" ON public.users
    FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users
    FOR UPDATE USING (auth.uid() = id);

-- Polityki dla missions
CREATE POLICY "Anyone can view active missions" ON public.missions
    FOR SELECT USING (status = 'active' OR EXISTS (
        SELECT 1 FROM public.users WHERE id = auth.uid() AND is_admin = true
    ));

CREATE POLICY "Admins can manage missions" ON public.missions
    FOR ALL USING (EXISTS (
        SELECT 1 FROM public.users WHERE id = auth.uid() AND is_admin = true
    ));

-- Polityki dla submissions
CREATE POLICY "Users can view own submissions" ON public.submissions
    FOR SELECT USING (user_id = auth.uid() OR EXISTS (
        SELECT 1 FROM public.users WHERE id = auth.uid() AND is_admin = true
    ));

CREATE POLICY "Users can create own submissions" ON public.submissions
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can update submissions" ON public.submissions
    FOR UPDATE USING (EXISTS (
        SELECT 1 FROM public.users WHERE id = auth.uid() AND is_admin = true
    ));

-- Polityki dla achievements
CREATE POLICY "Anyone can view achievements" ON public.achievements
    FOR SELECT USING (true);

CREATE POLICY "Admins can manage achievements" ON public.achievements
    FOR ALL USING (EXISTS (
        SELECT 1 FROM public.users WHERE id = auth.uid() AND is_admin = true
    ));

-- Polityki dla user_achievements
CREATE POLICY "Users can view own achievements" ON public.user_achievements
    FOR SELECT USING (user_id = auth.uid() OR true);

-- Polityki dla notifications
CREATE POLICY "Users can view own notifications" ON public.notifications
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update own notifications" ON public.notifications
    FOR UPDATE USING (user_id = auth.uid());

-- =====================================================
-- STORAGE (przechowywanie plików)
-- =====================================================
-- Utwórz bucket dla zdjęć z misji (uruchom w Supabase Dashboard -> Storage)

-- INSERT INTO storage.buckets (id, name, public) VALUES ('mission-photos', 'mission-photos', true);

-- Polityka dla storage
-- CREATE POLICY "Users can upload mission photos" ON storage.objects
--     FOR INSERT WITH CHECK (bucket_id = 'mission-photos' AND auth.role() = 'authenticated');

-- CREATE POLICY "Anyone can view mission photos" ON storage.objects
--     FOR SELECT USING (bucket_id = 'mission-photos');

-- =====================================================
-- PRZYKŁADOWE DANE (opcjonalne)
-- =====================================================

-- Przykładowe misje
INSERT INTO public.missions (title, description, xp_reward, type, location_name, qr_code_value, status) VALUES
('Powitanie w Turbo Challenge', 'Zeskanuj kod QR przy wejściu, aby rozpocząć przygodę!', 50, 'qr_code', 'Punkt startowy', 'TC-START-2024', 'active'),
('Selfie z maskotką', 'Zrób selfie z maskotką Turbo i prześlij zdjęcie', 100, 'photo', 'Strefa Turbo', NULL, 'active'),
('Quiz wiedzy o motoryzacji', 'Odpowiedz na 5 pytań o świecie motoryzacji', 75, 'quiz', NULL, NULL, 'active'),
('Odwiedź punkt serwisowy', 'Dotknij lokalizacji punktu serwisowego', 60, 'gps', 'Punkt serwisowy Turbo', NULL, 'active')
ON CONFLICT DO NOTHING;

-- Dodaj dane quizu do misji quizowej
UPDATE public.missions
SET quiz_data = '{
    "questions": [
        {
            "id": "q1",
            "question": "Ile kół ma typowy samochód osobowy?",
            "answers": [
                {"id": "a1", "text": "3", "is_correct": false},
                {"id": "a2", "text": "4", "is_correct": true},
                {"id": "a3", "text": "6", "is_correct": false},
                {"id": "a4", "text": "8", "is_correct": false}
            ],
            "points": 20
        },
        {
            "id": "q2",
            "question": "Co oznacza skrót ABS?",
            "answers": [
                {"id": "a1", "text": "Auto Braking System", "is_correct": false},
                {"id": "a2", "text": "Anti-lock Braking System", "is_correct": true},
                {"id": "a3", "text": "Automatic Balance System", "is_correct": false},
                {"id": "a4", "text": "Advanced Brake Support", "is_correct": false}
            ],
            "points": 20
        },
        {
            "id": "q3",
            "question": "Jaki kolor ma światło STOP?",
            "answers": [
                {"id": "a1", "text": "Zielony", "is_correct": false},
                {"id": "a2", "text": "Żółty", "is_correct": false},
                {"id": "a3", "text": "Czerwony", "is_correct": true},
                {"id": "a4", "text": "Niebieski", "is_correct": false}
            ],
            "points": 20
        }
    ],
    "passing_score": 60,
    "time_limit": 120
}'::jsonb
WHERE type = 'quiz';

-- Przykładowe osiągnięcia
INSERT INTO public.achievements (name, description, icon, condition_type, condition_value, xp_bonus) VALUES
('Pierwszy krok', 'Ukończ swoją pierwszą misję', '🎯', 'missions_count', 1, 25),
('Pięć gwiazdek', 'Ukończ 5 misji', '⭐', 'missions_count', 5, 50),
('Mistrz quizów', 'Ukończ 3 quizy', '🧠', 'mission_type_count', 3, 75),
('Fotograf', 'Prześlij 5 zdjęć', '📸', 'mission_type_count', 5, 75),
('Turbo Legenda', 'Osiągnij poziom 10', '🔥', 'level', 10, 500)
ON CONFLICT DO NOTHING;

-- =====================================================
-- GOTOWE!
-- =====================================================
-- Teraz skonfiguruj:
-- 1. Authentication -> Providers -> włącz Google i Email
-- 2. Storage -> utwórz bucket "mission-photos" (public)
-- 3. Skopiuj SUPABASE_URL i SUPABASE_ANON_KEY do .env.local
