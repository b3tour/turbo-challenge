'use client';

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { User as SupabaseUser, Session } from '@supabase/supabase-js';
import { User } from '@/types';

interface AuthState {
  session: Session | null;
  user: SupabaseUser | null;
  profile: User | null;
  loading: boolean;
  error: string | null;
}

interface AuthContextType extends AuthState {
  isAuthenticated: boolean;
  hasProfile: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string) => Promise<{ success: boolean; error: string | null }>;
  signUpWithEmail: (email: string, password: string) => Promise<{ success: boolean; error: string | null }>;
  signInWithPassword: (email: string, password: string) => Promise<{ success: boolean; error: string | null }>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<User>) => Promise<{ success: boolean; error: string | null }>;
  createProfile: (nick: string, phone?: string) => Promise<{ success: boolean; error: string | null }>;
  checkNickAvailable: (nick: string) => Promise<boolean>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

// Cache dla profilu
let profileCache: { [userId: string]: { data: User; timestamp: number } } = {};
const CACHE_TTL = 600000; // 10 minut - dłuższy cache zapobiega niepotrzebnym odświeżeniom

// Cache dla sprawdzania nicków (poza komponentem)
let nickCheckCache: { [nick: string]: { available: boolean; timestamp: number } } = {};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    session: null,
    user: null,
    profile: null,
    loading: true,
    error: null,
  });

  // Pobierz profil z cache lub z bazy
  const fetchProfile = useCallback(async (userId: string, forceRefresh = false): Promise<User | null> => {
    // Sprawdź cache
    const cached = profileCache[userId];
    if (!forceRefresh && cached && Date.now() - cached.timestamp < CACHE_TTL) {
      console.log('[Auth] Profil z cache');
      return cached.data;
    }

    try {
      console.log('[Auth] Pobieram profil z bazy dla:', userId);

      // Dodaj timeout 5 sekund
      const timeoutPromise = new Promise<{ data: null; error: { message: string } }>((resolve) => {
        setTimeout(() => {
          console.log('[Auth] Timeout pobierania profilu');
          resolve({ data: null, error: { message: 'Timeout' } });
        }, 5000);
      });

      const queryPromise = supabase
        .from('users')
        .select('id, email, nick, phone, avatar_url, total_xp, level, class, is_admin, created_at, updated_at')
        .eq('id', userId)
        .maybeSingle();

      const { data, error } = await Promise.race([queryPromise, timeoutPromise]);

      if (error) {
        console.log('[Auth] Błąd pobierania profilu:', error.message);
        return null;
      }

      if (!data) {
        console.log('[Auth] Profil nie istnieje w bazie');
        return null;
      }

      console.log('[Auth] Profil pobrany:', data.nick);
      // Zapisz w cache
      profileCache[userId] = { data: data as User, timestamp: Date.now() };
      return data as User;
    } catch (e) {
      console.error('[Auth] Exception przy pobieraniu profilu:', e);
      return null;
    }
  }, []);

  // Inicjalizacja - jednorazowo z retry
  useEffect(() => {
    let mounted = true;
    let timeoutId: NodeJS.Timeout;
    let retryCount = 0;
    const maxRetries = 1; // Zmniejszone z 2 - szybsze wykrywanie błędów

    const initAuth = async () => {
      try {
        console.log('[Auth] Inicjalizacja, próba:', retryCount + 1);

        // Timeout na 8 sekund - skrócony dla lepszego UX
        const sessionPromise = supabase.auth.getSession();
        const timeoutPromise = new Promise((_, reject) => {
          timeoutId = setTimeout(() => reject(new Error('Auth timeout')), 8000);
        });

        const { data: { session } } = await Promise.race([sessionPromise, timeoutPromise]) as { data: { session: Session | null } };
        clearTimeout(timeoutId);

        if (!mounted) return;

        console.log('[Auth] Sesja pobrana:', session ? 'zalogowany' : 'brak sesji');

        let profile = null;
        if (session?.user) {
          console.log('[Auth] Pobieram profil dla:', session.user.id);
          profile = await fetchProfile(session.user.id);
          console.log('[Auth] Profil:', profile ? 'znaleziony' : 'brak');
        }

        setState({
          session,
          user: session?.user ?? null,
          profile,
          loading: false,
          error: null,
        });
      } catch (error) {
        if (!mounted) return;
        console.error('[Auth] Błąd inicjalizacji:', error, 'Próba:', retryCount + 1);

        // Spróbuj ponownie tylko raz
        if (retryCount < maxRetries) {
          retryCount++;
          console.log(`[Auth] Ponowna próba ${retryCount}/${maxRetries}...`);
          setTimeout(() => initAuth(), 2000);
          return;
        }

        // Przy błędzie - ustaw loading na false, żeby strona się nie zawiesiła
        console.error('[Auth] Wszystkie próby nieudane, pokazuję błąd');
        setState({
          session: null,
          user: null,
          profile: null,
          loading: false,
          error: 'Błąd połączenia z serwerem. Sprawdź internet i odśwież stronę.',
        });
      }
    };

    initAuth();

    // Nasłuchuj zmian autoryzacji
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;

      console.log('[Auth] onAuthStateChange:', event);

      // Ignoruj INITIAL_SESSION - już obsłużone powyżej
      if (event === 'INITIAL_SESSION') return;

      // Przy TOKEN_REFRESHED lub USER_UPDATED - tylko aktualizuj sesję, zachowaj istniejący profil
      // To zapobiega niepotrzebnemu ładowaniu i przekierowaniom
      if (event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
        console.log('[Auth] Token/User odświeżony, zachowuję profil');
        setState(prev => ({
          ...prev,
          session,
          user: session?.user ?? null,
          // Zachowaj istniejący profil - nie resetuj!
        }));
        return;
      }

      // Przy SIGNED_OUT - wyczyść wszystko
      if (event === 'SIGNED_OUT') {
        console.log('[Auth] Wylogowano');
        profileCache = {};
        setState({
          session: null,
          user: null,
          profile: null,
          loading: false,
          error: null,
        });
        return;
      }

      // Przy SIGNED_IN - pobierz profil
      if (event === 'SIGNED_IN' && session?.user) {
        console.log('[Auth] Zalogowano, pobieram profil');
        const profile = await fetchProfile(session.user.id, true);
        setState({
          session,
          user: session.user,
          profile,
          loading: false,
          error: null,
        });
        return;
      }

      // Dla innych eventów - zachowaj istniejący profil jeśli mamy sesję
      if (session?.user) {
        setState(prev => ({
          ...prev,
          session,
          user: session.user,
          // Zachowaj profil z poprzedniego stanu
        }));
      }
    });

    return () => {
      mounted = false;
      clearTimeout(timeoutId);
      subscription.unsubscribe();
    };
  }, [fetchProfile]);

  // Logowanie przez Google
  const signInWithGoogle = async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setState(prev => ({ ...prev, loading: false, error: error.message }));
    }
  };

  // Logowanie przez email (magic link)
  const signInWithEmail = async (email: string) => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setState(prev => ({ ...prev, loading: false, error: error.message }));
      return { success: false, error: error.message };
    }

    setState(prev => ({ ...prev, loading: false }));
    return { success: true, error: null };
  };

  // Rejestracja z hasłem
  const signUpWithEmail = async (email: string, password: string) => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setState(prev => ({ ...prev, loading: false, error: error.message }));
      return { success: false, error: error.message };
    }

    setState(prev => ({ ...prev, loading: false }));
    return { success: true, error: null };
  };

  // Logowanie z hasłem (obsługuje nick lub email)
  const signInWithPassword = async (loginIdentifier: string, password: string) => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    let emailToUse = loginIdentifier;

    // Sprawdź czy to email (zawiera @) czy nick
    if (!loginIdentifier.includes('@')) {
      // To nick - znajdź email użytkownika
      console.log('[Auth] Logowanie po nicku:', loginIdentifier);

      const { data: userData, error: lookupError } = await supabase
        .from('users')
        .select('email')
        .ilike('nick', loginIdentifier)
        .maybeSingle();

      if (lookupError || !userData) {
        setState(prev => ({ ...prev, loading: false, error: null }));
        return { success: false, error: 'Nie znaleziono użytkownika o takim nicku' };
      }

      emailToUse = userData.email;
      console.log('[Auth] Znaleziono email dla nicku:', emailToUse);
    }

    const { error } = await supabase.auth.signInWithPassword({
      email: emailToUse,
      password,
    });

    if (error) {
      setState(prev => ({ ...prev, loading: false, error: error.message }));
      return { success: false, error: error.message };
    }

    setState(prev => ({ ...prev, loading: false }));
    return { success: true, error: null };
  };

  // Wylogowanie
  const signOut = async () => {
    setState(prev => ({ ...prev, loading: true }));
    profileCache = {}; // Wyczyść cache
    await supabase.auth.signOut();
    setState({
      session: null,
      user: null,
      profile: null,
      loading: false,
      error: null,
    });
  };

  // Aktualizuj profil
  const updateProfile = async (updates: Partial<User>) => {
    if (!state.user) return { success: false, error: 'Nie jesteś zalogowany' };

    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', state.user.id)
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    // Aktualizuj cache i stan
    profileCache[state.user.id] = { data: data as User, timestamp: Date.now() };
    setState(prev => ({ ...prev, profile: data as User }));
    return { success: true, error: null };
  };

  // Utwórz profil (po pierwszym logowaniu)
  const createProfile = async (nick: string, phone?: string) => {
    if (!state.user) {
      console.error('createProfile: No user logged in');
      return { success: false, error: 'Nie jesteś zalogowany' };
    }

    console.log('createProfile: Starting for user', state.user.id, 'nick:', nick);

    try {
      const newProfile = {
        id: state.user.id,
        email: state.user.email!,
        nick,
        phone: phone || null,
        total_xp: 0,
        level: 1,
        class: 'solo',
        is_admin: false,
      };

      console.log('createProfile: Inserting profile...', newProfile);

      // Timeout 10 sekund
      const timeoutPromise = new Promise<{ data: null; error: { message: string } }>((resolve) => {
        setTimeout(() => resolve({ data: null, error: { message: 'Przekroczono limit czasu. Sprawdź połączenie z internetem.' } }), 10000);
      });

      const insertPromise = supabase
        .from('users')
        .insert(newProfile)
        .select('id, email, nick, phone, avatar_url, total_xp, level, class, is_admin, created_at, updated_at')
        .single();

      const { data, error } = await Promise.race([insertPromise, timeoutPromise]);

      if (error) {
        console.error('createProfile: Supabase error', error);
        return { success: false, error: `Błąd tworzenia profilu: ${error.message}` };
      }

      if (!data) {
        console.error('createProfile: No data returned');
        return { success: false, error: 'Nie udało się utworzyć profilu - brak danych' };
      }

      console.log('createProfile: Success!', data);

      // Zapisz w cache i stanie
      profileCache[state.user.id] = { data: data as User, timestamp: Date.now() };
      setState(prev => ({ ...prev, profile: data as User }));
      return { success: true, error: null };
    } catch (e) {
      console.error('createProfile: Exception', e);
      return { success: false, error: 'Wystąpił nieoczekiwany błąd' };
    }
  };

  // Sprawdź czy nick jest dostępny
  const checkNickAvailable = useCallback(async (nick: string): Promise<boolean> => {
    // Sprawdź cache (5 sekund)
    const cached = nickCheckCache[nick];
    if (cached && Date.now() - cached.timestamp < 5000) {
      return cached.available;
    }

    try {
      // Dodaj timeout 5 sekund
      const timeoutPromise = new Promise<{ data: null; error: { message: string } }>((resolve) => {
        setTimeout(() => resolve({ data: null, error: { message: 'Timeout' } }), 5000);
      });

      const queryPromise = supabase
        .from('users')
        .select('id')
        .eq('nick', nick)
        .maybeSingle();

      const { data, error } = await Promise.race([queryPromise, timeoutPromise]);

      if (error) {
        console.error('Nick check error:', error);
        // Przy błędzie/timeout zakładamy że nick jest dostępny, żeby nie blokować użytkownika
        return true;
      }

      const available = data === null;
      nickCheckCache[nick] = { available, timestamp: Date.now() };
      return available;
    } catch (e) {
      console.error('Nick check exception:', e);
      return true;
    }
  }, []);

  // Odśwież profil
  const refreshProfile = async () => {
    if (!state.user) return;
    const profile = await fetchProfile(state.user.id, true);
    setState(prev => ({ ...prev, profile }));
  };

  const value: AuthContextType = {
    ...state,
    isAuthenticated: !!state.session,
    hasProfile: !!state.profile,
    signInWithGoogle,
    signInWithEmail,
    signUpWithEmail,
    signInWithPassword,
    signOut,
    updateProfile,
    createProfile,
    checkNickAvailable,
    refreshProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
