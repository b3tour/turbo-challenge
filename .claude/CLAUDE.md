# Turbo Challenge - Dokumentacja dla Claude

## Przegląd Aplikacji

**Turbo Challenge** to aplikacja grywalizacyjna stworzona dla Fundacji Turbo Pomoc. Gracze zdobywają punkty XP wykonując misje, zbierają karty kolekcjonerskie samochodów i rywalizują w rankingach. Zakup kart wspiera cele charytatywne fundacji.

## Stack Technologiczny

| Technologia | Użycie |
|-------------|--------|
| Next.js 14 | Framework (App Router) |
| TypeScript | Typowanie |
| Tailwind CSS | Stylowanie |
| Supabase | Backend (DB, Auth, Storage) |
| Vercel | Hosting |

## Struktura Projektu

```
turbo-challenge/
├── src/
│   ├── app/
│   │   ├── (app)/              # Strony zalogowanych użytkowników
│   │   │   ├── dashboard/      # Główny ekran
│   │   │   ├── cards/          # Kolekcja kart
│   │   │   ├── battles/        # Turbo Bitwy (PvP)
│   │   │   ├── missions/       # Lista misji
│   │   │   ├── mystery/        # Mystery Garage
│   │   │   ├── leaderboard/    # Rankingi
│   │   │   ├── profile/        # Profil gracza
│   │   │   ├── rewards/        # Nagrody
│   │   │   └── scan/           # Skaner QR
│   │   ├── (admin)/
│   │   │   └── admin/          # Panel administracyjny
│   │   └── (auth)/
│   │       ├── login/
│   │       ├── register/
│   │       └── onboarding/
│   ├── components/
│   │   ├── ui/                 # Bazowe komponenty UI
│   │   └── cards/              # Komponenty kart
│   ├── hooks/                  # Custom React hooks
│   ├── lib/                    # Utilities, Supabase client
│   └── types/                  # TypeScript interfaces
├── public/                     # Statyczne assety
└── .claude/                    # Dokumentacja dla Claude
```

## Główne Funkcjonalności

### 1. System Misji
- Typy: QR code, Photo, Quiz, GPS, Manual
- Statusy zgłoszeń: pending, approved, rejected, revoked, failed
- XP za ukończenie misji

### 2. Karty Kolekcjonerskie
- **Typy**: achievement (pionowe 3:4), car (poziome 16:9)
- **Rzadkości**: common, rare, epic, legendary
- **Turbo Heroes**: specjalne karty kierowców
- **Zakup charytatywny**: wpłata = karta + XP
- **Extended info**: dodatkowe dane widoczne po odblokowaniu
- **Galeria**: do 6 zdjęć do pobrania jako tapety

### 3. Mystery Garage
- Pakiety losowych kart (3/5/10 sztuk)
- System zamówień z kodem przelewu
- Losowanie według szans na rzadkość

### 4. Turbo Bitwy
- PvP między graczami
- Kategorie: power, torque, speed, total
- Nagrody: XP lub karty

### 5. Rankingi
- Ranking XP (główny)
- Ranking wsparcia (suma datków)

## Baza Danych (Supabase)

### Główne Tabele
- `users` - profile graczy
- `missions` - definicje misji
- `submissions` - zgłoszenia wykonania misji
- `cards` - karty kolekcjonerskie
- `user_cards` - posiadane karty
- `card_orders` - zamówienia kart
- `card_images` - galeria zdjęć kart
- `mystery_pack_types` - typy pakietów
- `mystery_pack_purchases` - zakupy pakietów
- `card_battles` - bitwy między graczami
- `rewards` - nagrody dla TOP graczy
- `levels` - progi XP i nazwy poziomów

### Storage Buckets
- `avatars` - zdjęcia profilowe
- `submissions` - zdjęcia z misji
- `card-images` - obrazki kart i galerii
- `missions` - obrazki misji
- `rewards` - obrazki nagród

## Kluczowe Hooki

```typescript
useAuth()        // Autentykacja, profil użytkownika
useCards()       // Karty, fetchCardImages()
useCardOrders()  // Zamówienia kart
useLeaderboard() // Rankingi
```

## Paleta Kolorów (Tailwind)

```
turbo-500  #d946ef  // Główny różowy/magenta
accent-400 #22d3ee  // Cyjan
purple-600 #9333ea  // Fiolet
dark-800   #1e293b  // Tło kart
dark-900   #0f172a  // Tło główne
```

## Custom Animacje

```javascript
// tailwind.config.js
'wiggle-intense': 'wiggle-intense 0.8s ease-in-out infinite'  // 7° obrót
'shake-soft': 'shake-soft 0.6s ease-in-out infinite'
'shimmer': 'shimmer 2s infinite'
'pulse-glow': 'pulse-glow 2s ease-in-out infinite'
```

## Komendy

```bash
npm run dev      # Development server
npm run build    # Production build
npm run lint     # Linting
```

## Deploy

Automatyczny deploy na Vercel po push do `main` branch.

## Preferencje Użytkownika

- Minimalistyczny design
- Bez zbędnych emoji w UI (poza celowymi animacjami)
- Kolory ramek kart wystarczą do oznaczenia rzadkości
- Animacja wiggle 7° dla interaktywnych elementów

## Ważne Uwagi

1. **RLS włączone** - każda tabela ma Row Level Security
2. **Admin sprawdzany** przez `users.is_admin`
3. **Obrazki** - max 5MB, formaty: JPG, PNG, WebP
4. **Zamówienia** - system z kodem przelewu, ręczna weryfikacja admina

## Ostatnie Zmiany (Styczeń 2026)

- Extended card info (engine, cylinders, acceleration, weight, drivetrain, fun_fact)
- Galeria zdjęć kart (do 6 zdjęć, pobieranie jako tapety)
- Mystery Garage
- Turbo Bitwy
- Ulepszenia wizualne kart
