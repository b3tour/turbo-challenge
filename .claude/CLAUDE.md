# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

**Turbo Challenge** — gamification app for Fundacja Turbo Pomoc. Players earn XP via missions, collect car trading cards, battle PvP, tune cars, and compete in rankings. Card purchases support the charity. UI language is Polish.

## Commands

```bash
npm run dev      # Development server (Turbo)
npm run build    # Production build
npm run lint     # ESLint
```

## Stack

- **Next.js 14** (App Router) + **TypeScript** + **Tailwind CSS 3**
- **Supabase** (DB, Auth with PKCE, Storage, RLS on all tables)
- **Framer Motion** for animations
- **Lucide React** for icons
- **Vercel** hosting (FRA1 region, auto-deploy on push to `main`)

## Architecture

### Route Groups
- `src/app/(app)/` — protected user pages (layout.tsx handles auth guard, redirects to /login or /onboarding)
- `src/app/(admin)/` — admin panel (checks `users.is_admin`)
- `src/app/(auth)/` — login, register, onboarding

### Key Pages
- `/dashboard` — main screen (profile card, missions grid, Turbo Album, feature grid)
- `/arena` — hub with 3 tabs: Turbo Bitwy (battles), Strefa Tuningu, Rankingi
- `/cards` — Turbo Album (card collection browser)
- `/mystery` — Mystery Garage (random card packs)
- `/missions` — all available missions
- `/battles`, `/tuning` — thin wrappers redirecting to Arena tab content

### Navigation
- **Mobile**: `Header.tsx` (top) + `BottomNav.tsx` (bottom, Framer Motion spring animations, cyan #22d3ee accent)
- **Desktop (lg+)**: `Sidebar.tsx` (left, same cyan glow styling)
- Breakpoint switch in `(app)/layout.tsx` via `lg:hidden` / `hidden lg:block`

### Data Layer
All data flows through custom hooks in `src/hooks/`:

| Hook | Purpose |
|------|---------|
| `useAuth()` | Auth, profile, session (10-min cache) |
| `useCards()` | Card collection, rarity filters, stats |
| `useBattles()` | PvP card battles (v2: 3-round, slot-based) |
| `useTuning()` | Car tuning mods, tuning challenges |
| `useMissions()` | Mission fetching, submission (5 types) |
| `useMysteryPacks()` | Random card packs |
| `useLeaderboard()` | XP + donation rankings |
| `useArenaRankings()` | Combined battle + tuning rankings |
| `useLevels()` | XP → level calculation (10 tiers) |
| `useCardOrders()` | Card purchase orders |
| `useAnnouncements()` | Admin announcements + notifications |
| `useAppContent()` | Editable app content |

### Component Organization
- `src/components/ui/` — reusable primitives (Card, Button, Modal, Avatar, ProgressBar, etc.)
- `src/components/layout/` — Header, BottomNav, Sidebar, NotificationBell, LoadingScreen
- `src/components/arena/` — BattlesContent, TuningContent, ArenaRankings
- `src/components/missions/` — MissionCard, QRScanner, PhotoUpload, Quiz, GPSChecker
- `src/components/cards/` — CollectibleCardDisplay

### Types
All interfaces in `src/types/index.ts`. Key types: `User`, `Mission`, `Submission`, `CollectibleCard`, `UserCard`, `CardBattle`, `TunedCar`, `TuningChallenge`, `MysteryPackType`.

## Design System

### Color Palette (tailwind.config.js)
```
turbo-500   #8b5cf6   // Main violet
accent-400  #818cf8   // Indigo accent
Nav active  #22d3ee   // Cyan (hardcoded in BottomNav/Sidebar)
```

### Surface System
```
surface-0  #0a0a0f   // Body background
surface-1  #12121a   // Card backgrounds
surface-2  #1a1a24   // Elevated cards, hover states
surface-3  #22222e   // Higher elevation
surface-4  #2a2a38   // Highest elevation
```

### Logo
- Header: Lucide `Heart` icon (fill turbo-500) + "TURBO" (font-semibold 600, white) + "CHALLENGE" (font-extrabold 800, turbo-500)
- Responsive: `text-lg sm:text-xl`, icon `w-5 sm:w-6`

### Card Rarities
common (gray), rare (blue), epic (purple), legendary (gold) — borders + CSS effects (shimmer, pulse-glow, holographic)

## Database

### Key Tables
`users`, `missions`, `submissions`, `cards`, `user_cards`, `card_images`, `card_orders`, `card_battles`, `tuned_cars`, `tuning_challenges`, `mystery_pack_types`, `mystery_pack_purchases`, `levels`, `notifications`, `announcements`, `rewards`

### Storage Buckets
`avatars`, `submissions`, `card-images`, `missions`, `rewards`

### Migrations
SQL files in `supabase/` — schema.sql (base), plus individual migration files for battles, tuning, announcements, and fixes.

## Feature Details

### Turbo Bitwy (Card Battles v2)
3-round PvP: each player gets 3 random car cards, assigns to power/torque/speed slots. Winner of 2+ rounds wins. XP rewards. 48h challenge expiry. 7 achievement badges.

### Tuning System
Mods: engine, turbo/exhaust, weight reduction (stages 0-3). Categories: drag, hill_climb, track, time_attack — each weights HP/torque/speed differently. Costs XP to upgrade.

### Mission Types
qr_code, photo, quiz (classic + speedrun), gps (radius validation), manual

## Project Memory

Session history, known issues, technical decisions, and next steps are tracked in `status/PROJECT_STATUS.md`. Read it at the start of each session for full context. Update rules are in `status/CLAUDE_INSTRUCTIONS.md`.

## User Preferences

- Minimalist dark theme, no excessive emoji
- Polish language throughout UI
- Mobile-first, touch-friendly
- Card border colors indicate rarity
- Framer Motion spring animations (stiffness: 500, damping: 30) for nav
