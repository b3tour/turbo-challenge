-- Migracja: Karta Właściciela (Owner Card)
-- Dodaje kolumnę owner_user_id do tabeli cards
-- Jeśli ustawiona, karta jest permanentnie przypisana do właściciela prawdziwego auta

ALTER TABLE public.cards
  ADD COLUMN IF NOT EXISTS owner_user_id UUID REFERENCES public.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_cards_owner_user_id ON public.cards(owner_user_id);

COMMENT ON COLUMN public.cards.owner_user_id IS 'UUID właściciela prawdziwego auta. Karta jest permanentnie przypisana i chroniona przed usunięciem.';
