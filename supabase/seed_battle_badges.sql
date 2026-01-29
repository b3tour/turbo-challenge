-- ============================================
-- ODZNAKI BITEWNE - Karty osiagniec (achievement)
-- Uruchom w Supabase SQL Editor
-- ============================================

-- 1. Debiutant (common) - 1 wygrana
INSERT INTO public.cards (
  name, description, card_type, category, rarity, points,
  is_active, is_purchasable, image_url
) VALUES (
  'Debiutant',
  'Wygraj pierwszą bitwę',
  'achievement',
  'Bitwy',
  'common',
  10,
  true,
  false,
  null
);

-- 2. Wojownik (rare) - 5 wygranych
INSERT INTO public.cards (
  name, description, card_type, category, rarity, points,
  is_active, is_purchasable, image_url
) VALUES (
  'Wojownik',
  'Wygraj 5 bitew',
  'achievement',
  'Bitwy',
  'rare',
  25,
  true,
  false,
  null
);

-- 3. Weteran (rare) - 10 wygranych
INSERT INTO public.cards (
  name, description, card_type, category, rarity, points,
  is_active, is_purchasable, image_url
) VALUES (
  'Weteran',
  'Wygraj 10 bitew',
  'achievement',
  'Bitwy',
  'rare',
  50,
  true,
  false,
  null
);

-- 4. Mistrz Areny (epic) - 25 wygranych
INSERT INTO public.cards (
  name, description, card_type, category, rarity, points,
  is_active, is_purchasable, image_url
) VALUES (
  'Mistrz Areny',
  'Wygraj 25 bitew',
  'achievement',
  'Bitwy',
  'epic',
  100,
  true,
  false,
  null
);

-- 5. Legenda Bitew (legendary) - 50 wygranych
INSERT INTO public.cards (
  name, description, card_type, category, rarity, points,
  is_active, is_purchasable, image_url
) VALUES (
  'Legenda Bitew',
  'Wygraj 50 bitew',
  'achievement',
  'Bitwy',
  'legendary',
  200,
  true,
  false,
  null
);

-- 6. Perfekcjonista (rare) - wygrana 3-0
INSERT INTO public.cards (
  name, description, card_type, category, rarity, points,
  is_active, is_purchasable, image_url
) VALUES (
  'Perfekcjonista',
  'Wygraj bitwę 3-0',
  'achievement',
  'Bitwy',
  'rare',
  50,
  true,
  false,
  null
);

-- 7. Gladiator (common) - 10 bitew rozegranych
INSERT INTO public.cards (
  name, description, card_type, category, rarity, points,
  is_active, is_purchasable, image_url
) VALUES (
  'Gladiator',
  'Rozegraj 10 bitew',
  'achievement',
  'Bitwy',
  'common',
  25,
  true,
  false,
  null
);

-- Weryfikacja
SELECT id, name, rarity, card_type, category, points
FROM public.cards
WHERE card_type = 'achievement' AND category = 'Bitwy'
ORDER BY points;
