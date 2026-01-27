-- =====================================================
-- USUWANIE DUPLIKATÓW KART - Uruchom w SQL Editor Supabase
-- =====================================================
-- Problem: Seed scripts uruchomione wielokrotnie tworzą karty o tej samej nazwie.
-- Ten skrypt zachowuje 1 egzemplarz każdej karty i przepina wszystkie powiązania.

-- =====================================================
-- KROK 1: DIAGNOSTYKA - Sprawdź duplikaty (uruchom najpierw samo to)
-- =====================================================

-- Pokaż duplikaty kart (karty o tej samej nazwie)
SELECT
  name,
  COUNT(*) as count,
  ARRAY_AGG(id ORDER BY created_at) as card_ids,
  ARRAY_AGG(rarity ORDER BY created_at) as rarities
FROM cards
GROUP BY name
HAVING COUNT(*) > 1
ORDER BY count DESC, name;

-- =====================================================
-- KROK 2: CZYSZCZENIE - Uruchom po weryfikacji diagnostyki
-- =====================================================
-- UWAGA: Wykonaj KROK 1 najpierw, żeby zobaczyć co będzie usunięte.
-- Gdy jesteś pewien, odkomentuj i uruchom poniższe bloki.

-- === 2a. Przepnij user_cards z duplikatów na oryginały ===
-- (Dla każdej grupy duplikatów, najstarsza karta = oryginał)

/*
DO $$
DECLARE
  dup RECORD;
  keeper_id UUID;
  dupe_id UUID;
  dupe_ids UUID[];
BEGIN
  -- Iteruj po duplikatach
  FOR dup IN
    SELECT name, ARRAY_AGG(id ORDER BY created_at) as ids
    FROM cards
    GROUP BY name
    HAVING COUNT(*) > 1
  LOOP
    -- Pierwszy (najstarszy) to keeper
    keeper_id := dup.ids[1];
    -- Reszta to duplikaty
    dupe_ids := dup.ids[2:];

    FOREACH dupe_id IN ARRAY dupe_ids
    LOOP
      -- Przepnij user_cards: zmień card_id na keeper
      -- Ale najpierw sprawdź czy user już nie ma keepera (unikaj duplikatów w user_cards)
      UPDATE user_cards
      SET card_id = keeper_id
      WHERE card_id = dupe_id
        AND user_id NOT IN (
          SELECT user_id FROM user_cards WHERE card_id = keeper_id
        );

      -- Usuń user_cards które byłyby duplikatami (user już ma tę kartę)
      DELETE FROM user_cards WHERE card_id = dupe_id;

      -- Przepnij card_images (galeria zdjęć)
      UPDATE card_images
      SET card_id = keeper_id
      WHERE card_id = dupe_id
        AND NOT EXISTS (
          SELECT 1 FROM card_images ci2
          WHERE ci2.card_id = keeper_id AND ci2.image_url = card_images.image_url
        );
      DELETE FROM card_images WHERE card_id = dupe_id;

      -- Przepnij card_orders (zamówienia)
      UPDATE card_orders SET card_id = keeper_id WHERE card_id = dupe_id;

      -- Przepnij mystery_pack_purchases jeśli zawiera card_id
      -- (tabela może mieć pole z received_card_ids jako JSONB)

      RAISE NOTICE 'Duplikat "%" (%) -> keeper (%)', dup.name, dupe_id, keeper_id;
    END LOOP;
  END LOOP;
END $$;
*/

-- === 2b. Usuń duplikaty kart (zachowaj najstarszy egzemplarz) ===

/*
DELETE FROM cards
WHERE id IN (
  SELECT unnest(ids[2:])
  FROM (
    SELECT name, ARRAY_AGG(id ORDER BY created_at) as ids
    FROM cards
    GROUP BY name
    HAVING COUNT(*) > 1
  ) dups
);
*/

-- === 2c. Weryfikacja - sprawdź czy nie ma więcej duplikatów ===

/*
SELECT name, COUNT(*) as count
FROM cards
GROUP BY name
HAVING COUNT(*) > 1;
-- Powinno zwrócić 0 wierszy
*/

-- =====================================================
-- KROK 3 (OPCJONALNY): Zabezpieczenie na przyszłość
-- =====================================================
-- Dodaj unikalny indeks na nazwie karty, żeby duplikaty nie mogły powstać ponownie

/*
CREATE UNIQUE INDEX IF NOT EXISTS idx_cards_name_unique ON cards(name);
*/

-- =====================================================
-- PODSUMOWANIE:
-- 1. Uruchom KROK 1 (diagnostyka) - bez odkomentowywania
-- 2. Sprawdź listę duplikatów
-- 3. Odkomentuj blok 2a, uruchom (przepnięcie powiązań)
-- 4. Odkomentuj blok 2b, uruchom (usunięcie duplikatów)
-- 5. Odkomentuj blok 2c, uruchom (weryfikacja)
-- 6. Opcjonalnie: odkomentuj KROK 3 (zabezpieczenie)
-- =====================================================
