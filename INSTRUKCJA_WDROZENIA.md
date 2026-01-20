# Turbo Challenge - Instrukcja Wdrożenia

Kompletny przewodnik uruchomienia aplikacji grywalizacyjnej Turbo Challenge.

---

## Spis treści

1. [Wymagania wstępne](#1-wymagania-wstępne)
2. [Konfiguracja Supabase](#2-konfiguracja-supabase)
3. [Konfiguracja projektu lokalnie](#3-konfiguracja-projektu-lokalnie)
4. [Deployment na Vercel](#4-deployment-na-vercel)
5. [Konfiguracja domeny](#5-konfiguracja-domeny)
6. [Pierwsze uruchomienie](#6-pierwsze-uruchomienie)
7. [Zarządzanie aplikacją](#7-zarządzanie-aplikacją)
8. [Rozwiązywanie problemów](#8-rozwiązywanie-problemów)

---

## 1. Wymagania wstępne

### Potrzebne konta (wszystkie darmowe):
- **Supabase** - https://supabase.com (baza danych + autoryzacja)
- **Vercel** - https://vercel.com (hosting)
- **GitHub** - https://github.com (repozytorium kodu)
- **Google Cloud Console** - https://console.cloud.google.com (logowanie Google)

### Oprogramowanie na komputerze:
- **Node.js** (wersja 18+) - https://nodejs.org
- **Git** - https://git-scm.com
- **Edytor kodu** (np. VS Code) - https://code.visualstudio.com

---

## 2. Konfiguracja Supabase

### Krok 2.1: Utwórz projekt

1. Wejdź na https://supabase.com i zaloguj się
2. Kliknij **"New Project"**
3. Wypełnij:
   - **Name**: `turbo-challenge`
   - **Database Password**: wygeneruj silne hasło (zapisz je!)
   - **Region**: `Central EU (Frankfurt)` - najbliżej Polski
4. Kliknij **"Create new project"** i poczekaj ~2 minuty

### Krok 2.2: Uruchom schemat bazy danych

1. W panelu Supabase przejdź do **SQL Editor** (ikona w lewym menu)
2. Kliknij **"New query"**
3. Skopiuj całą zawartość pliku `supabase/schema.sql`
4. Wklej do edytora SQL
5. Kliknij **"Run"** (zielony przycisk)
6. Powinny pojawić się zielone znaczniki sukcesu

### Krok 2.3: Skonfiguruj Storage (dla zdjęć)

1. Przejdź do **Storage** w lewym menu
2. Kliknij **"New bucket"**
3. Wypełnij:
   - **Name**: `mission-photos`
   - **Public bucket**: TAK (zaznacz)
4. Kliknij **"Create bucket"**

### Krok 2.4: Włącz autoryzację Email

1. Przejdź do **Authentication** → **Providers**
2. Znajdź **Email** i upewnij się, że jest włączony
3. Opcjonalnie: wyłącz "Confirm email" jeśli nie chcesz weryfikacji

### Krok 2.5: Włącz logowanie Google

1. Przejdź do **Authentication** → **Providers**
2. Znajdź **Google** i kliknij żeby rozwinąć
3. Włącz przełącznik **"Enable Sign in with Google"**
4. Pozostaw otwarte - będziesz potrzebować **Callback URL**

### Krok 2.6: Skonfiguruj Google Cloud Console

1. Wejdź na https://console.cloud.google.com
2. Utwórz nowy projekt lub wybierz istniejący
3. Przejdź do **APIs & Services** → **OAuth consent screen**
4. Wybierz **External** i wypełnij wymagane pola
5. Przejdź do **Credentials** → **Create Credentials** → **OAuth client ID**
6. Wybierz **Web application**
7. Dodaj **Authorized redirect URIs**:
   - Wklej URL z Supabase (z kroku 2.5)
   - Np: `https://xyz.supabase.co/auth/v1/callback`
8. Skopiuj **Client ID** i **Client Secret**
9. Wklej je do Supabase (krok 2.5) i zapisz

### Krok 2.7: Zapisz dane dostępowe

Przejdź do **Settings** → **API** i zapisz:
- **Project URL** (np. `https://abcdefgh.supabase.co`)
- **anon/public key** (długi klucz zaczynający się od `eyJ...`)

---

## 3. Konfiguracja projektu lokalnie

### Krok 3.1: Otwórz terminal w folderze projektu

```bash
cd "C:\Users\WORK\Desktop\Aplikacja Turbo\turbo-challenge"
```

### Krok 3.2: Utwórz plik zmiennych środowiskowych

Skopiuj przykładowy plik:
```bash
copy .env.local.example .env.local
```

### Krok 3.3: Edytuj .env.local

Otwórz plik `.env.local` w edytorze i wypełnij:

```env
NEXT_PUBLIC_SUPABASE_URL=https://TWOJ-PROJEKT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=Turbo Challenge
```

### Krok 3.4: Zainstaluj zależności

```bash
npm install
```

### Krok 3.5: Uruchom lokalnie (test)

```bash
npm run dev
```

Otwórz http://localhost:3000 w przeglądarce.

---

## 4. Deployment na Vercel

### Krok 4.1: Prześlij kod na GitHub

1. Utwórz nowe repozytorium na GitHub (prywatne)
2. W terminalu:

```bash
git init
git add .
git commit -m "Initial commit - Turbo Challenge"
git branch -M main
git remote add origin https://github.com/TWOJ-USERNAME/turbo-challenge.git
git push -u origin main
```

### Krok 4.2: Połącz z Vercel

1. Wejdź na https://vercel.com i zaloguj się przez GitHub
2. Kliknij **"Add New..."** → **"Project"**
3. Wybierz repozytorium `turbo-challenge`
4. Vercel automatycznie wykryje Next.js

### Krok 4.3: Dodaj zmienne środowiskowe

W sekcji **"Environment Variables"** dodaj:

| Name | Value |
|------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://twoj-projekt.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJ...` (twój klucz) |
| `NEXT_PUBLIC_APP_URL` | `https://turbo-challenge.vercel.app` |
| `NEXT_PUBLIC_APP_NAME` | `Turbo Challenge` |

### Krok 4.4: Deploy

1. Kliknij **"Deploy"**
2. Poczekaj 1-2 minuty
3. Po zakończeniu otrzymasz URL (np. `turbo-challenge.vercel.app`)

### Krok 4.5: Zaktualizuj Supabase

1. W Supabase przejdź do **Authentication** → **URL Configuration**
2. Dodaj URL Vercel do **Redirect URLs**:
   - `https://turbo-challenge.vercel.app/auth/callback`

---

## 5. Konfiguracja domeny (opcjonalnie)

Jeśli masz własną domenę:

1. W Vercel: **Settings** → **Domains** → dodaj domenę
2. Skonfiguruj DNS u swojego dostawcy
3. Zaktualizuj URL w Supabase i zmiennych środowiskowych

---

## 6. Pierwsze uruchomienie

### Krok 6.1: Utwórz konto admina

1. Wejdź na stronę aplikacji
2. Zarejestruj się normalnie (Google lub Email)
3. Wybierz nick

### Krok 6.2: Nadaj uprawnienia admina

1. W Supabase przejdź do **Table Editor** → **users**
2. Znajdź swoje konto
3. Zmień `is_admin` z `false` na `true`
4. Zapisz

### Krok 6.3: Odśwież aplikację

1. Wyloguj się i zaloguj ponownie
2. Powinieneś widzieć link do **Panelu Admina** w menu

---

## 7. Zarządzanie aplikacją

### Dodawanie misji

1. Wejdź w **Panel Admina** → **Misje**
2. Kliknij **"Dodaj nową misję"**
3. Wypełnij formularz:
   - Tytuł i opis
   - Typ misji (QR, zdjęcie, quiz, GPS)
   - Nagroda XP
   - Lokalizacja (opcjonalnie)
4. Dla misji QR - wydrukuj wygenerowany kod

### Moderacja zgłoszeń

1. Gdy użytkownicy wysyłają zdjęcia, pojawiają się w **Zgłoszeniach**
2. Przejrzyj zdjęcie
3. Zatwierdź lub odrzuć

### Generowanie kodów QR

Dla misji typu QR otrzymujesz unikalny kod (np. `TC-1705234567-ABC123`).
Wygeneruj obrazek kodu QR:
- https://www.qr-code-generator.com
- Wpisz kod jako tekst
- Pobierz PNG i wydrukuj

---

## 8. Rozwiązywanie problemów

### Problem: "Brak połączenia z bazą danych"

**Rozwiązanie:**
1. Sprawdź czy URL i klucz Supabase są poprawne
2. Sprawdź czy projekt Supabase jest aktywny (nie wstrzymany)

### Problem: "Logowanie Google nie działa"

**Rozwiązanie:**
1. Sprawdź Callback URL w Google Cloud Console
2. Upewnij się, że domena jest dodana do Authorized domains
3. Sprawdź czy Client ID i Secret są poprawne w Supabase

### Problem: "Zdjęcia się nie wgrywają"

**Rozwiązanie:**
1. Sprawdź czy bucket `mission-photos` istnieje
2. Upewnij się, że jest publiczny
3. Sprawdź polityki RLS dla storage

### Problem: "Aplikacja jest wolna"

**Rozwiązanie:**
1. Supabase może mieć cold start - odczekaj chwilę
2. Sprawdź plan Supabase (darmowy ma limity)
3. Zoptymalizuj zapytania do bazy

---

## Koszty szacunkowe

| Usługa | Darmowy limit | Koszt po przekroczeniu |
|--------|--------------|------------------------|
| **Supabase** | 500MB bazy, 1GB storage | ~$25/mies. (plan Pro) |
| **Vercel** | 100GB bandwidth | ~$20/mies. (plan Pro) |
| **Domena** | - | ~$10-15/rok |

**Dla 500-2000 użytkowników darmowe plany powinny wystarczyć!**

---

## Wsparcie

Masz pytania? Problemy z wdrożeniem?

1. Sprawdź dokumentację:
   - Supabase: https://supabase.com/docs
   - Vercel: https://vercel.com/docs
   - Next.js: https://nextjs.org/docs

2. Społeczność:
   - Supabase Discord: https://discord.supabase.com
   - Next.js Discord: https://discord.gg/nextjs

---

**Powodzenia z Turbo Challenge! 🚀**
