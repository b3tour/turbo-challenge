# Turbo Challenge — Status Projektu

Ostatnia aktualizacja: 2026-02-03 (sesja 5)

## Kontekst

Turbo Challenge — aplikacja grywalizacyjna dla Fundacji Turbo Pomoc. Next.js 14 + Supabase + Vercel. Gracze zdobywaja XP przez misje, zbieraja karty samochodow, walcza PvP (Turbo Bitwy), tunuja auta i rywalizuja w rankingach. Zakup kart wspiera cele charytatywne. UI po polsku. Projekt w fazie aktywnego rozwoju. Deploy automatyczny na Vercel (FRA1) po pushu.

---

## Znane problemy

- Brak wlasnego logo serca (SVG) — aktualnie uzywa Lucide Heart z fill turbo-500. Uzytkownik chce przeslac wlasne.
- Hook `useCards.ts` linia 103 — pobiera user_cards bez paginacji (domyslny limit 1000 Supabase). Przy duzej kolekcji moze nie zwrocic wszystkich kart. Do naprawy analogicznie jak w admin resecie.
- Cards page: demo mode (przykladowe karty gdy brak danych) — martwy kod ~90 linii. Na razie zostawiony, do usuniecia w przyszlosci.
- INP issue na segmented controls (taby Cards) — ~337ms blokady UI przy przelaczaniu tabow. Do optymalizacji (startTransition, React.memo, lazy loading).

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

**Strefa Tuningu — lista aut bez zmian (02.02 sesja 4)** — Proba redesignu listy aut odrzucona. Obecny compact layout zostaje. Przycisk "Modyfikuj" (zielony) zamiast "Mody".

**Strefa Tuningu — stats bar + modal redesign (03.02 sesja 5)** — Naglowek "Strefa Tuningu" zastapiony 4-kafelkowym stats barem (Garaz/Tuning/Zainwestowane/Dostepne XP) z progress barami. Grid-cols-2 mobile, grid-cols-4 sm+. Rozmiary: liczba 16px, sufiks 13px. Modal modyfikacji: dodano p-4 padding (globalnie w Modal.tsx), kolory stage'ow green/amber/red, downgrade modow z 50% zwrotem XP.

**Rarity tile tokens (02.02 sesja 3)** — Kafelki rzadkosci kart uzywaja `RARITY_TILE_TOKENS` z per-rarity: radial gradient bg, accent color, glow, border active/hover. Common accent: gray-300 (#D1D5DB), nie gray-500. Ikona Common: Copy (lucide). Progress bar z kaskadowa animacja (100ms start + 200ms stagger). Bold collected / lighter total count style (`<bold>2</bold>/25`).

---

## Ostatnia sesja — 2026-02-03 (sesja 5)

### Co zrobiono:
- Strefa Tuningu — zastapiono naglowek "Strefa Tuningu" 4-kafelkowym stats barem:
  - Garaz (CarFront, cyan) — ilosc aut + dostepnych, poprawna polska odmiana (auto/auta/aut)
  - Tuning (CircleGauge, green) — X/Y ulepszen z progress barem
  - Zainwestowane (Coins, amber) — XP w modach z progress barem
  - Dostepne XP (Zap, turbo) — dostepne z total, progress bar
  - Grid-cols-2 mobile, grid-cols-4 sm+. Rozmiary: 16px liczba, 13px sufiks.
- Przycisk "Mody" na liscie aut zmieniony na "Modyfikuj" (zielony).
- Modal modyfikacji auta — redesign:
  - Dodano p-4 padding do Modal.tsx content area (globalnie dla wszystkich modali).
  - Kolory kropek stage: zielony (1), pomaranczowy (2), czerwony (3) — w modalu i na liscie aut.
  - Downgrade modow — nowy przycisk ChevronDown, cofniecie o 1 stage, 50% zwrotu XP.
  - Nowa funkcja `downgradeMod` w `useTuning.ts`, helper `getDowngradeRefund` w `tuningConfig.ts`.

### Commity:
```
fe6d55e Merge preview/tuning-modal-redesign: padding, stage colors, downgrade
2fb6011 Redesign tuning modify modal: padding, stage colors, downgrade
d2b72d9 Merge preview/tuning-stats-bar: Tuning stats bar replacing header
89575fa Adjust stats tile font sizes: main number 16px, suffix text 13px
85be242 Rename car list button from Tuning to Modyfikuj
69bfa3c Rename Mody to Tuning, fix Polish labels, green Tuning button on car list
7b747fd Change Garaż tile icon to CarFront
a772058 Fix Polish: Garaż label, correct plural declension for auta/aut, dostępnych
4548b4e Reorder stats bar tiles: Garaz, Mody, Zainwestowane, Dostepne XP
9f9f13d Replace Strefa Tuningu header with full-width stats bar
```

### Zmienione pliki:
- `src/components/arena/TuningContent.tsx` — stats bar, kolory stage, downgrade, nazwy przyciskow
- `src/components/ui/Modal.tsx` — p-4 padding w content area
- `src/hooks/useTuning.ts` — nowa funkcja downgradeMod
- `src/config/tuningConfig.ts` — nowy helper getDowngradeRefund

---

## Historia sesji

### 2026-02-02 (sesja 4) — Kategorie tuningowe w modalu
- Dodano sekcje "Sila w kategoriach" do modala modyfikacji (Drag/Hill Climb/Track/Time Attack).
- Proba redesignu listy aut Strefy Tuningu — odrzucona, obecny layout zostaje.
- Commity: `70ca2b5`, `7bdec0b`

### 2026-02-02 (sesja 3) — Premium rarity tiles redesign
- Nowy RARITY_TILE_TOKENS z gradient bg, accent colors, glow per rarity.
- Kaskadowa animacja progress barow, completed state z checkmark.
- Ikona Common: SquareDashedBottom → Copy, accent rozjasniony do gray-300.
- Bold/lighter count style w rarity tiles, section headers, dashboard.
- Commity: `21b4b6d`, `b51abe5`, `c8d6329`, `dd6d601`, `80765c9`, `68aaa11`, `2747a53`, `2bc8966`, `53f2a14`

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

---

## Nastepne kroki

1. Wlasne logo serca (SVG) od uzytkownika — podmienic Lucide Heart
2. Paginacja w `useCards.ts` (linia 103) — analogicznie do naprawy w admin resecie
3. Organizacja plikow roboczych (skrypty JS, SQL, screenshoty) — przeniesienie do archiwum
4. Dalsze poprawki UI na podstawie wizualnego review
5. Ewentualne usuniecie demo mode z Cards (martwy kod)
6. Optymalizacja INP na segmented controls (startTransition / React.memo / lazy)

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
