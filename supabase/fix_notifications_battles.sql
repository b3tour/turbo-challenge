-- =====================================================
-- NAPRAWA POWIADOMIEŃ DLA BITEW - Uruchom w SQL Editor Supabase
-- =====================================================
-- Problem: Powiadomienia o wynikach bitew nie są zapisywane, bo:
-- 1. CHECK constraint na kolumnie 'type' nie zawiera battle_challenge/battle_result
-- 2. Brak polityki INSERT pozwalającej na tworzenie powiadomień dla innych użytkowników

-- =====================================================
-- 1. Napraw CHECK constraint - dodaj nowe typy powiadomień
-- =====================================================
-- Usuń stary constraint
ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS notifications_type_check;

-- Dodaj nowy constraint z typami bitewnymi
ALTER TABLE public.notifications ADD CONSTRAINT notifications_type_check
    CHECK (type IN (
        'xp_gain',
        'level_up',
        'achievement',
        'mission_approved',
        'mission_rejected',
        'card_received',
        'battle_challenge',
        'battle_result',
        'system'
    ));

-- =====================================================
-- 2. Napraw RLS - dodaj politykę INSERT dla powiadomień
-- =====================================================
-- Usuń istniejące polityki (na wypadek gdyby istniały)
DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can insert notifications" ON public.notifications;
DROP POLICY IF EXISTS "Authenticated users can insert notifications" ON public.notifications;

-- Upewnij się że RLS jest włączone
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- SELECT: Użytkownik widzi swoje powiadomienia
CREATE POLICY "Users can view own notifications" ON public.notifications
    FOR SELECT USING (user_id = auth.uid());

-- UPDATE: Użytkownik aktualizuje swoje powiadomienia (np. mark as read)
CREATE POLICY "Users can update own notifications" ON public.notifications
    FOR UPDATE USING (user_id = auth.uid());

-- INSERT: Zalogowany użytkownik może tworzyć powiadomienia (np. wyzwania bitewne)
CREATE POLICY "Authenticated users can insert notifications" ON public.notifications
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Nadaj uprawnienia
GRANT SELECT, INSERT, UPDATE ON public.notifications TO authenticated;
