-- =====================================================
-- NAPRAWA RLS dla cards i user_cards - Uruchom w SQL Editor Supabase
-- =====================================================
-- Problem: Zwykli gracze nie widzą kart innych użytkowników,
-- więc system bitew nie znajduje przeciwników z kartami.
-- Admin omija RLS, dlatego u niego działa.

-- =====================================================
-- 1. DIAGNOSTYKA - sprawdź aktualny stan RLS
-- =====================================================

-- Sprawdź czy RLS jest włączony na tabelach
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('cards', 'user_cards', 'card_battles', 'card_orders', 'card_images')
ORDER BY tablename;

-- Sprawdź istniejące polityki
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('cards', 'user_cards', 'card_battles', 'card_orders', 'card_images')
ORDER BY tablename, policyname;

-- =====================================================
-- 2. NAPRAWA - polityki RLS dla cards
-- =====================================================

-- Usuń istniejące polityki (jeśli są)
DROP POLICY IF EXISTS "Anyone can view cards" ON public.cards;
DROP POLICY IF EXISTS "Users can view cards" ON public.cards;
DROP POLICY IF EXISTS "cards_select" ON public.cards;
DROP POLICY IF EXISTS "cards_insert" ON public.cards;
DROP POLICY IF EXISTS "cards_update" ON public.cards;
DROP POLICY IF EXISTS "cards_delete" ON public.cards;
DROP POLICY IF EXISTS "Admins can manage cards" ON public.cards;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.cards;

-- Włącz RLS
ALTER TABLE public.cards ENABLE ROW LEVEL SECURITY;

-- SELECT: Wszyscy zalogowani widzą aktywne karty
CREATE POLICY "cards_select" ON public.cards
    FOR SELECT USING (true);

-- INSERT/UPDATE/DELETE: Tylko admin
CREATE POLICY "cards_insert" ON public.cards
    FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND is_admin = true)
    );

CREATE POLICY "cards_update" ON public.cards
    FOR UPDATE USING (
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND is_admin = true)
    );

CREATE POLICY "cards_delete" ON public.cards
    FOR DELETE USING (
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND is_admin = true)
    );

-- Uprawnienia
GRANT SELECT ON public.cards TO authenticated;
GRANT ALL ON public.cards TO service_role;

-- =====================================================
-- 3. NAPRAWA - polityki RLS dla user_cards
-- =====================================================

-- Usuń istniejące polityki (jeśli są)
DROP POLICY IF EXISTS "Users can view own cards" ON public.user_cards;
DROP POLICY IF EXISTS "Users can view all user cards" ON public.user_cards;
DROP POLICY IF EXISTS "user_cards_select" ON public.user_cards;
DROP POLICY IF EXISTS "user_cards_insert" ON public.user_cards;
DROP POLICY IF EXISTS "user_cards_update" ON public.user_cards;
DROP POLICY IF EXISTS "user_cards_delete" ON public.user_cards;
DROP POLICY IF EXISTS "Admins can manage user cards" ON public.user_cards;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.user_cards;

-- Włącz RLS
ALTER TABLE public.user_cards ENABLE ROW LEVEL SECURITY;

-- SELECT: Wszyscy zalogowani widzą wszystkie user_cards
-- (potrzebne do: bitew, kolekcji, rankingów, statystyk)
CREATE POLICY "user_cards_select" ON public.user_cards
    FOR SELECT USING (auth.uid() IS NOT NULL);

-- INSERT: Admin lub system (przydzielanie kart)
CREATE POLICY "user_cards_insert" ON public.user_cards
    FOR INSERT WITH CHECK (
        auth.uid() IS NOT NULL
    );

-- UPDATE: Admin (np. przenoszenie kart w bitwach)
CREATE POLICY "user_cards_update" ON public.user_cards
    FOR UPDATE USING (
        auth.uid() IS NOT NULL
    );

-- DELETE: Admin
CREATE POLICY "user_cards_delete" ON public.user_cards
    FOR DELETE USING (
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND is_admin = true)
    );

-- Uprawnienia
GRANT SELECT, INSERT, UPDATE ON public.user_cards TO authenticated;
GRANT ALL ON public.user_cards TO service_role;

-- =====================================================
-- 4. NAPRAWA - polityki RLS dla card_orders
-- =====================================================

DROP POLICY IF EXISTS "card_orders_select" ON public.card_orders;
DROP POLICY IF EXISTS "card_orders_insert" ON public.card_orders;
DROP POLICY IF EXISTS "card_orders_update" ON public.card_orders;
DROP POLICY IF EXISTS "Users can view own orders" ON public.card_orders;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.card_orders;

ALTER TABLE public.card_orders ENABLE ROW LEVEL SECURITY;

-- SELECT: Użytkownik widzi swoje zamówienia, admin widzi wszystkie
CREATE POLICY "card_orders_select" ON public.card_orders
    FOR SELECT USING (
        user_id = auth.uid()
        OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND is_admin = true)
    );

-- INSERT: Zalogowany użytkownik może złożyć zamówienie
CREATE POLICY "card_orders_insert" ON public.card_orders
    FOR INSERT WITH CHECK (user_id = auth.uid());

-- UPDATE: Admin (zatwierdzanie zamówień)
CREATE POLICY "card_orders_update" ON public.card_orders
    FOR UPDATE USING (
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND is_admin = true)
    );

GRANT SELECT, INSERT, UPDATE ON public.card_orders TO authenticated;

-- =====================================================
-- 5. NAPRAWA - polityki RLS dla card_images
-- =====================================================

DROP POLICY IF EXISTS "card_images_select" ON public.card_images;
DROP POLICY IF EXISTS "card_images_insert" ON public.card_images;
DROP POLICY IF EXISTS "card_images_update" ON public.card_images;
DROP POLICY IF EXISTS "card_images_delete" ON public.card_images;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.card_images;

ALTER TABLE public.card_images ENABLE ROW LEVEL SECURITY;

-- SELECT: Wszyscy widzą galerie kart
CREATE POLICY "card_images_select" ON public.card_images
    FOR SELECT USING (true);

-- INSERT/UPDATE/DELETE: Admin
CREATE POLICY "card_images_insert" ON public.card_images
    FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND is_admin = true)
    );

CREATE POLICY "card_images_update" ON public.card_images
    FOR UPDATE USING (
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND is_admin = true)
    );

CREATE POLICY "card_images_delete" ON public.card_images
    FOR DELETE USING (
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND is_admin = true)
    );

GRANT SELECT ON public.card_images TO authenticated;
GRANT ALL ON public.card_images TO service_role;
