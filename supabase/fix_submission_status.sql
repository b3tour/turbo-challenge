-- =====================================================
-- FIX: Dodanie statusów 'revoked' i 'failed' do submissions
-- =====================================================

-- Usuń stary CHECK constraint
ALTER TABLE public.submissions DROP CONSTRAINT IF EXISTS submissions_status_check;

-- Dodaj nowy CHECK constraint z dodatkowymi statusami
ALTER TABLE public.submissions
ADD CONSTRAINT submissions_status_check
CHECK (status IN ('pending', 'approved', 'rejected', 'revoked', 'failed'));

-- Gotowe! Teraz można używać statusów:
-- pending  - oczekuje na weryfikację
-- approved - zatwierdzone
-- rejected - odrzucone (gracz może spróbować ponownie)
-- revoked  - wycofane przez admina (gracz może spróbować ponownie)
-- failed   - nieukończone (np. czas minął w quizie)
