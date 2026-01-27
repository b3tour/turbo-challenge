-- =====================================================
-- NAPRAWA RLS dla card_battles - Uruchom w SQL Editor Supabase
-- =====================================================
-- Problem: Opponent nie może zaakceptować bitwy, bo polityka UPDATE
-- pozwala tylko challengerowi na modyfikację wiersza.

-- 1. Usuń istniejące polityki (jeśli istnieją)
DROP POLICY IF EXISTS "Users can view own battles" ON public.card_battles;
DROP POLICY IF EXISTS "Users can create battles" ON public.card_battles;
DROP POLICY IF EXISTS "Users can update own battles" ON public.card_battles;
DROP POLICY IF EXISTS "Challenger can update battles" ON public.card_battles;
DROP POLICY IF EXISTS "card_battles_select" ON public.card_battles;
DROP POLICY IF EXISTS "card_battles_insert" ON public.card_battles;
DROP POLICY IF EXISTS "card_battles_update" ON public.card_battles;
DROP POLICY IF EXISTS "card_battles_delete" ON public.card_battles;

-- 2. Upewnij się że RLS jest włączone
ALTER TABLE public.card_battles ENABLE ROW LEVEL SECURITY;

-- 3. SELECT: Użytkownik widzi bitwy w których uczestniczy (jako challenger lub opponent)
CREATE POLICY "card_battles_select" ON public.card_battles
    FOR SELECT USING (
        auth.uid() = challenger_id
        OR auth.uid() = opponent_id
    );

-- 4. INSERT: Użytkownik może tworzyć bitwy jako challenger
CREATE POLICY "card_battles_insert" ON public.card_battles
    FOR INSERT WITH CHECK (
        auth.uid() = challenger_id
    );

-- 5. UPDATE: Zarówno challenger jak i opponent mogą aktualizować bitwę
--    (challenger np. anuluje, opponent akceptuje/odrzuca)
CREATE POLICY "card_battles_update" ON public.card_battles
    FOR UPDATE USING (
        auth.uid() = challenger_id
        OR auth.uid() = opponent_id
    );

-- 6. DELETE: Tylko challenger może usunąć bitwę (opcjonalne)
CREATE POLICY "card_battles_delete" ON public.card_battles
    FOR DELETE USING (
        auth.uid() = challenger_id
    );

-- 7. Nadaj uprawnienia
GRANT SELECT, INSERT, UPDATE, DELETE ON public.card_battles TO authenticated;
