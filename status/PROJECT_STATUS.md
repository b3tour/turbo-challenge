# Turbo Challenge — Status Projektu

Ostatnia aktualizacja: 2026-03-16 (sesja 9+10)

## Kontekst

Turbo Challenge — aplikacja grywalizacyjna dla Fundacji Turbo Pomoc. Next.js 14 + Supabase + Vercel. Gracze zdobywaja XP przez misje, zbieraja karty samochodow, walcza PvP (Turbo Bitwy), tunuja auta i rywalizuja w rankingach. Zakup kart wspiera cele charytatywne. UI po polsku. Projekt w fazie aktywnego rozwoju. Deploy automatyczny na Vercel (FRA1) po pushu.

---

## Znane problemy

- Brak wlasnego logo serca (SVG) — aktualnie uzywa Lucide Heart z fill turbo-500. Uzytkownik chce przeslac wlasne.
- Cards page: demo mode (przykladowe karty gdy brak danych) — martwy kod ~90 linii. Na razie zostawiony, do usuniecia w przyszlosci.
- INP issue na segmented controls (taby Cards) — ~337ms blokady UI przy przelaczaniu tabow. Do optymalizacji (startTransition, React.memo, lazy loading).
- Avatar upload uzywa bucket `mission-photos` zamiast `avatars` (profile/page.tsx linia 114, 126).

## Audyt pre-launch — pozostale bugi do naprawy

### Faza B — bezpieczenstwo XP/kart (wymaga Supabase RPC):
- Atomowy `complete_mission` (insert submission + add_xp w transakcji) — zapobiega double XP
- Atomowy `resolve_battle` (UPDATE WHERE status='pending') — zapobiega double-accept
- Server-side `open_pack` (losowanie + insert w jednej funkcji) — zapobiega manipulacji Math.random
- UNIQUE constraint na `submissions(user_id, mission_id)` dla jednorazowych misji
- `dealRandomCards` w bitwach dziala client-side — gracz moze podmienic karty
- Limit 30 wyzwan/tydzien sprawdzany tylko client-side

### Faza C — performance (przed 500+ userami):
- `allCards` fetch bez paginacji (useCards.ts) — ucina przy >1000 kart w katalogu
- `getChallengablePlayers` ciagnie 5000 wierszy do przegladarki
- `useArenaRankings` bez limitu — zapytania coraz wolniejsze z czasem
- Submissions query w leaderboard uciety przy >1000 wierszy
- Server-side agregacje dla rankingów (views/materialized views)

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

**System nagrod (14.02 sesja 7)** — RewardType: `'xp' | 'cards' | 'lottery'`. Nagrody pogrupowane w adminie na 3 sekcje. Strona /rewards ma 3 sekcje z info boxami. Rankingi (leaderboard + arena) pokazuja baner z nagroda glowna. Backward compatibility: `donation` → `cards`, `null` → `xp`. Losowania: `place: 0`.

**Ankiety / Survey (sesja 6)** — Nowy typ misji `survey`. Dane w `survey_data JSONB` (nie w quiz_data). Odpowiedzi zapisywane jako string: ID opcji lub `"other:tekst"`. Admin: edytor pytania + opcji, podglad wynikow z procentami. Komponent `Survey.tsx` w `src/components/missions/`.

---

## Ostatnia sesja — 2026-03-16 (sesja 9+10)

### Sesja 9 — hardening + skalowanie:
- **Paginacja useCards.ts** — naprawiono bug z limitem 1000 wierszy. Petla z `.range()`.
- **Leaderboard: realtime → polling 60s** — zapobiega lawinie refetchow.
- **Rate limiting na submisji misji** — throttle 3s per-mission (nie globalny).
- **Console.log wyciszone** — useAuth.tsx (dev-only helper), layout.tsx (NODE_ENV check).
- **Indeksy wydajnosciowe** — plik `supabase/performance_indexes.sql`.

### Sesja 10 — PayU + powiadomienia + audyt + bugfixy:

**Integracja PayU (platnosci online):**
- `src/lib/payu.ts` — server-side helper (OAuth, tworzenie zamowien, weryfikacja IPN, pobranie metod platnosci)
- `src/app/api/payu/checkout/route.ts` — tworzy platnosc w PayU z wybrana metoda, zwraca redirect URL
- `src/app/api/payu/notify/route.ts` — webhook IPN: potwierdza platnosc, przyznaje karty + XP, wysyla powiadomienie
- `src/app/api/payu/methods/route.ts` — pobiera dostepne metody platnosci z PayU API (cache 5 min)
- `src/components/ui/PaymentGateway.tsx` — bramka platnosci w appce (BLIK, karta, Google/Apple Pay, szybkie przelewy, PayPo)
- `src/hooks/usePayU.ts` — client-side hook (nieuzywany po dodaniu PaymentGateway)
- Klucze PayU: POS ID 4013528, produkcja, env variables na Vercel
- Flow: gracz klika kup → zamowienie w DB → bramka platnosci → wybor metody → redirect do PayU → callback → karta + XP

**Powiadomienia:**
- Auto-announcement przy dodaniu/aktywacji misji w adminie
- Announcements maja teraz `link` (auto-detect z tytulu: "Nowa misja:" → /missions)
- "Wyczysc przeczytane" teraz czyści tez announcements (localStorage dismissed per user)
- Dropdown powiadomien w sidebarze otwiera sie w gore (fix clip)

**Audyt pre-launch (75 bugow znalezionych):**
- 14 CRITICAL, 22 HIGH, 25+ MEDIUM
- Przeglad: dashboard, layout, karty, mystery, arena, bitwy, tuning, auth, profil, admin, leaderboard, rewards, misje, QR, quiz, GPS, survey

**Faza A napraw (7 critical bugow naprawionych):**
1. Console.log w layout.tsx — dev-only guard
2. Quiz double-submit — submittedRef blokuje drugie wywolanie
3. QR Scanner memory leak — stream.getTracks().stop() po sprawdzeniu uprawnien
4. /scan pomijal level check — dodany required_level guard
5. Admin wasAdminBefore bypass — usuniety, odebranie praw dziala natychmiast
6. Nick case-sensitivity — .ilike() zamiast .eq(), error zwraca false
7. Throttle per-mission zamiast globalny

**Domena:**
- `challenge.turbopomoc.pl` podpieta pod Vercel (CNAME w Cyberfolks)
- Vercel Pro plan, Supabase Pro plan

**Hosting/infra:**
- Vercel Pro ($20/msc) — 1TB bandwidth, serverless functions
- Supabase Pro — 8GB baza, 250GB transfer, Micro compute
- Vercel env variables: 7 PayU + 2 Supabase + APP_URL

### Migracje SQL (DO URUCHOMIENIA przed launchem):
- `supabase/performance_indexes.sql` — indeksy wydajnosciowe
- `supabase/add_survey_type.sql` — kolumna survey_data (z sesji 6, jesli nie uruchomione)
- `supabase/update_reward_types.sql` — migracja typow nagrod (z sesji 7, jesli nie uruchomione)

---

## Poprzednia sesja — 2026-02-25 (sesja 8)

### Co zrobiono:
- Audyt bezpieczenstwa Supabase Security Advisor — naprawiono wszystkie bledy:
  - RLS wlaczony na 4 tabelach bez ochrony: `levels`, `mystery_pack_types`, `mystery_pack_purchases`, `rewards`
  - Naprawiono 2 zbyt luźne polityki RLS: `notifications` INSERT (ograniczony do own user_id), `tuning_challenges` UPDATE (ograniczony do challenger/opponent)
  - Dodano `SET search_path = public` do 12 funkcji (zapobieganie atakom schema injection)
  - Leaked Password Protection — niedostepne na planie Free (bug w UI Supabase z Captcha)
- Przywrocono usuniete pliki sesji (.claude/TODO, session files)

### Migracje SQL (uruchomione):
- `supabase/fix_security_advisor.sql` — RLS na levels, mystery_pack_types, mystery_pack_purchases, rewards
- `supabase/fix_security_warnings.sql` — search_path na funkcjach + naprawione polityki RLS
- Dodatkowe DROP+CREATE dla: `get_user_profile`, `request_nick_change`, `approve_nick_change`, `create_user_profile` (4-param version)

### Pozostale ostrzezenia:
- Leaked Password Protection — wymaga planu Pro, na Free nie da sie wlaczyc

---

## Historia sesji

### 2026-02-14 (sesja 7) — System nagrod
- RewardType rozszerzony na `'xp' | 'cards' | 'lottery'`
- Admin: formularz + grupowanie listy na 3 sekcje
- Strona /rewards: 3 sekcje z info boxami
- Leaderboard + Arena: banery nagrod
- Commity: `e49cfe9`

### 2026-02-14 (sesja 6) — Ankiety + regulamin
- Nowy typ misji: ankieta (survey) — komponent Survey.tsx, edytor w adminie, wyniki z procentami
- Regulamin i polityka prywatnosci (terms, privacy) po polsku
- Commity: `c70761e`, `4332955`, `086a4f6`

### 2026-02-03 (sesja 5) — Tuning stats bar + modal redesign
- Stats bar zastepujacy naglowek Strefy Tuningu (4 kafelki)
- Modal modyfikacji: padding, kolory stage, downgrade modow
- Commity: `fe6d55e`, `2fb6011`, `d2b72d9`, `89575fa`, `85be242`, `69bfa3c`, `7b747fd`, `a772058`, `4548b4e`, `9f9f13d`

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

### Priorytet 1 — przed launchem:
1. **Faza B audytu** — atomowe RPC w Supabase (complete_mission, resolve_battle, open_pack)
2. **Przetestowac platnosc PayU** — pelny flow z prawdziwa transakcja (BLIK/karta)
3. **Uruchomic brakujace SQL** — performance_indexes, add_survey_type, update_reward_types
4. **Avatar bucket** — zmienic `mission-photos` na `avatars` w profile/page.tsx

### Priorytet 2 — po launchu:
5. **Faza C audytu** — performance (server-side agregacje, paginacja allCards, limity zapytan)
6. **Bramka platnosci v2** — BLIK kod w appce (bez redirectu), lepszy UX
7. Wlasne logo serca (SVG)
8. Usuniecie demo mode z Cards (martwy kod)
9. Optymalizacja INP na segmented controls

### Priorytet 3 — rozwoj:
10. **Tryb druzynowy (Turbo Grywalizacja)** — plan gotowy w `Plan na Grywalizacje Druzyn.txt`
11. **Streamer Edition** — pomysly zapisane w memory
12. **Subdomena produkcyjna** — `challenge.turbopomoc.pl` (GOTOWE, podpiete)

---

## SQL do uruchomienia

| Plik | Status | Opis |
|------|--------|------|
| `supabase/performance_indexes.sql` | DO URUCHOMIENIA | Indeksy wydajnosciowe na user_cards, cards, submissions itd. (sesja 9) |
| `supabase/fix_tuning_challenges_fk.sql` | DO SPRAWDZENIA | Nullable tuned_car_id + ON DELETE SET NULL (z sesji 29.01) |
| `supabase/add_survey_type.sql` | DO URUCHOMIENIA | Dodaje kolumne survey_data JSONB do missions (sesja 6) |
| `supabase/update_reward_types.sql` | DO URUCHOMIENIA | Migracja: donation→cards, null→xp (sesja 7) |
| `supabase/fix_security_advisor.sql` | ZROBIONE (25.02) | RLS na levels, mystery_pack_types, mystery_pack_purchases, rewards |
| `supabase/fix_security_warnings.sql` | ZROBIONE (25.02) | search_path + naprawione polityki RLS |

---

## Stan RLS (zweryfikowany 25.02, sesja 8)

| Tabela | SELECT | INSERT | UPDATE | DELETE |
|--------|--------|--------|--------|--------|
| cards | Wszyscy (active) | Admin | Admin | Admin |
| user_cards | Zalogowani | Zalogowani | Zalogowani | Admin |
| card_battles | Challenger/Opponent | Challenger | Challenger/Opponent | Challenger |
| card_orders | Swoje + Admin | Swoje | Admin | - |
| card_images | Wszyscy | Admin | Admin | Admin |
| notifications | Swoje | Swoje (user_id) | Swoje | - |
| levels | Zalogowani | Admin | Admin | Admin |
| mystery_pack_types | Zalogowani | Admin | Admin | Admin |
| mystery_pack_purchases | Swoje + Admin | Swoje | - | - |
| rewards | Zalogowani | Admin | Admin | Admin |
| tuning_challenges | Zalogowani | Challenger | Challenger/Opponent | Challenger |
