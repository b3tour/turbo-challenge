# Turbo Challenge — Status Projektu

Ostatnia aktualizacja: 2026-02-02 (sesja 3)

## Kontekst

Turbo Challenge — aplikacja grywalizacyjna dla Fundacji Turbo Pomoc. Next.js 14 + Supabase + Vercel. Gracze zdobywaja XP przez misje, zbieraja karty samochodow, walcza PvP (Turbo Bitwy), tunuja auta i rywalizuja w rankingach. Zakup kart wspiera cele charytatywne. UI po polsku. Projekt w fazie aktywnego rozwoju. Deploy automatyczny na Vercel (FRA1) po pushu.

---

## Znane problemy

- Brak wlasnego logo serca (SVG) — aktualnie uzywa Lucide Heart z fill turbo-500. Uzytkownik chce przeslac wlasne.
- Hook `useCards.ts` linia 103 — pobiera user_cards bez paginacji (domyslny limit 1000 Supabase). Przy duzej kolekcji moze nie zwrocic wszystkich kart. Do naprawy analogicznie jak w admin resecie.
- Cards page: demo mode (przykladowe karty gdy brak danych) — martwy kod ~90 linii. Na razie zostawiony, do usuniecia w przyszlosci.

---

## Decyzje techniczne

**Nawigacja cyan vs violet** — Aktywne elementy nawigacji (BottomNav, Sidebar) uzywaja cyan #22d3ee (hardcoded), a nie turbo-500. Odroznia nawigacje od CTA buttonow.

**Tozsamosc kolorystyczna sekcji** — Kazda sekcja ma wlasny kolor akcendu w headerze, tabach i na dashboardzie:
- Arena: `red-500` (walki, rywalizacja)
- Misje: `pink-500` (punkty, XP)
- Karty: `purple-500` (kolekcjonowanie)
- Mystery Garage: `green-500` (losowanie, szczescie)
- Ranking: `amber-500` (zloto, medale, pozycja)
- Announcements: `turbo-500` (ogolny brand)

**Segmented controls** — Wszystkie taby/filtry uzywaja jednolitego stylu: `bg-surface-2 rounded-xl p-1 flex gap-1`, buttony: `flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium`. Aktywny tab w kolorze sekcji.

**Bitwy v2 (slot-based)** — Kazdy gracz dostaje 3 losowe karty i przydziela je do slotow power/torque/speed. Wygrywa kto wygra 2+ rundy. Cooldown 7 dni na uzyte karty.

**Owner Cards** — Karty z `owner_user_id` sa chronione: nie moga byc usuniete od wlasciciela, nie wchodza do puli losowania, przetrwaja reset kart.

**Supabase paginacja** — Domyslny limit 1000 wierszy. Wszystkie zapytania pobierajace potencjalnie >1000 rekordow musza uzywac petli z `.range()`. Naprawione w admin resecie kart (commit `7ef2eff`).

**Arena reorganizacja (02.02)** — Arena ma 4 taby na stronie glownej: Bitwy, Wyzwania, Historia, Ranking. BattlesContent przyjmuje prop `activeSubTab` ktory kontroluje widoczny tab i ukrywa wewnetrzny header/taby. Strefa Tuningu przeniesiona do strony Cards (3 taby: Samochody, Strefa tuningu, Osiagniecia). `/tuning` redirectuje do `/cards`. `/battles` nadal dziala z wewnetrznymi tabami.

**Misje level-lock** — Misje maja `min_level`. Gracze ponizej wymaganego poziomu widza je jako zablokowane z ikona klodki.

**Rarity tile tokens (02.02 sesja 3)** — Kafelki rzadkosci kart uzywaja `RARITY_TILE_TOKENS` z per-rarity: radial gradient bg, accent color, glow, border active/hover. Common accent: gray-300 (#D1D5DB), nie gray-500. Ikona Common: Copy (lucide). Progress bar z kaskadowa animacja (100ms start + 200ms stagger). Bold collected / lighter total count style (`<bold>2</bold>/25`).

---

## Ostatnia sesja — 2026-02-02 (sesja 3)

### Co zrobiono:
- Premium redesign kafelkow rzadkosci kart (rarity tiles) na stronie Cards:
  - Nowy `RARITY_TILE_TOKENS` z gradient backgrounds, accent colors, glow effects per rarity.
  - Kafelki z radial gradient tlem, progress barem (pill), wycentrowana ikona, bold count / lighter total.
  - Kaskadowa animacja progress barow — Common laduje pierwszy, potem Rare, Epic, Legend (100ms + 200ms stagger).
  - Completed state: pelny bar z glow + checkmark (Check icon).
  - Hover: scale 1.03 + shadow boost (tylko grid Samochody/button).
  - Aktywny filtr: tekst i ikona w kolorze rarity.
- Ikona Common zmieniona z SquareDashedBottom na Copy (lucide).
- Common accent rozjasniony z gray-500 (#9CA3AF) do gray-300 (#D1D5DB) — lepsze hover/glow.
- Styl bold/lighter count (np. **2**/25) zastosowany w 3 miejscach: rarity tiles, section headers, dashboard.
- Branch `preview/rarity-tiles-v2` — stworzony do podgladu, zmerge'owany do main, usuniety.

### Commity:
```
21b4b6d Merge preview/rarity-tiles-v2: Premium rarity tiles redesign
b51abe5 Apply bold/lighter count style to dashboard Turbo Karty section
c8d6329 Apply bold/lighter style to total card counts in section headers
dd6d601 Cascade progress bar animation: each rarity fills sequentially
80765c9 Slow down progress bar animation: 300ms delay + 800ms fill duration
68aaa11 Compact rarity tiles: bold count, animated bars, tighter spacing
2747a53 Common icon → Copy, brighter Common accent, hover glow on all tiles
2bc8966 Compact rarity tiles: smaller text, centered icon, accent color on active
53f2a14 Premium rarity tiles: gradient bg, progress bar, icon badge, completed state
```

### Zmienione pliki:
- `src/app/(app)/cards/page.tsx` — kompletny redesign rarity tiles (RARITY_TILE_TOKENS, gradient bg, progress bar, cascade animation, bold/lighter counts)
- `src/hooks/useCards.ts` — Common icon: SquareDashedBottom → Copy
- `src/app/(app)/dashboard/page.tsx` — bold/lighter count style w sekcji Turbo Karty

---

## Historia sesji

### 2026-02-02 (sesja 2) — Kolory sekcji, normalizacja segmented controls
- System tozsamosci kolorystycznej sekcji: Arena red-500, Misje pink-500, Mystery Garage green-500, Ranking amber-500.
- Mystery Garage header przerobiony z wycentrowanego gradientowego na standardowy styl.
- Normalizacja segmented controls: flex-1, py-2, justify-center, gap-1.5, bg-surface-2.
- Leaderboard: 3 rozne kolory tabow zastapione jednolitym amber-500.
- Fix flash "Tryb podgladu" na Cards.
- Commity: `b8934a1`, `e20f4fc`, `654e8d0`, `be1f365`, `9df0d41`, `9700dd0`

### 2026-02-02 (sesja 1) — Reorganizacja Arena i Cards
- Arena: usuniety gorny 3-tab pasek, 4 sub-taby (Bitwy, Wyzwania, Historia, Ranking)
- Strefa Tuningu przeniesiona z Arena do Cards (3 taby)
- Mystery Garage przeniesiony z Cards do Arena > Bitwy
- Fix modala misji, zmiana "Zbierz" na "Zbieraj"
- Commity: `047b457`, `0c29db5`, `697bb56`, `c54d7d9`, `163cec1`

### 2026-02-01 — Fix admin reset, fix filtry misji, system pamieci
- Naprawiono bulk reset kart w adminie (paginacja Supabase .range(), limit 1000)
- Naprawiono pasek filtrow misji (flex-1 + justify-center)
- Zinwentaryzowano pliki robocze, skonfigurowano system pamieci (folder status/)
- Commity: `7ef2eff`, `a0cbde6`

### 2026-01-31 — Redesign UI v2
- Framer Motion spring animation w BottomNav (cyan #22d3ee, stiffness 500, damping 30)
- Spojnosc Sidebar z BottomNav (Lucide Heart, cyan glow)
- Logo: Lucide Heart (fill turbo-500) + "TURBO" (semibold) + "CHALLENGE" (extrabold)
- Dashboard: mniejszy padding, misje w gridzie zamiast scroll, XP badge wiekszy
- Rebranding "Kolekcja kart" na "Turbo Album", potem "Turbo Karty"
- Commity: `eabe6b2` do `d42fd9c` (15 commitow)

### 2026-01-29 — Arena hub, dashboard redesign, fix FK
- Arena jako hub z 3 zakladkami (Turbo Bitwy, Strefa Tuningu, Rankingi)
- Dashboard skompresowany z ~5 ekranow do ~2
- Fix FK constraint przy usuwaniu tuned car — nullable tuned_car_id + ON DELETE SET NULL
- Commity: `899931c`, `ee2c3c0`, `5a78ba7`, `4b2d2d0`

### 2026-01-27 — Bitwy fixes, RLS, cooldown
- Fix limitu total_supply kart, RLS, powiadomien
- Historia bitew, wymuszenie rownej liczby kart, cooldown 7 dni
- Commity: `187e01f` do `00d633f` (6 commitow)

---

## Nastepne kroki

1. Wlasne logo serca (SVG) od uzytkownika — podmienic Lucide Heart
2. Paginacja w `useCards.ts` (linia 103) — analogicznie do naprawy w admin resecie
3. Organizacja plikow roboczych (skrypty JS, SQL, screenshoty) — przeniesienie do archiwum
4. Dalsze poprawki UI na podstawie wizualnego review
5. Ewentualne usuniecie demo mode z Cards (martwy kod)

---

## SQL do uruchomienia

| Plik | Status | Opis |
|------|--------|------|
| `supabase/fix_tuning_challenges_fk.sql` | DO SPRAWDZENIA | Nullable tuned_car_id + ON DELETE SET NULL (z sesji 29.01) |

---

## Stan RLS (zweryfikowany 27.01)

| Tabela | SELECT | INSERT | UPDATE | DELETE |
|--------|--------|--------|--------|--------|
| cards | Wszyscy (active) | Admin | Admin | Admin |
| user_cards | Zalogowani | Zalogowani | Zalogowani | Admin |
| card_battles | Challenger/Opponent | Challenger | Challenger/Opponent | Challenger |
| card_orders | Swoje + Admin | Swoje | Admin | - |
| card_images | Wszyscy | Admin | Admin | Admin |
| notifications | Swoje | Zalogowani | Swoje | - |
