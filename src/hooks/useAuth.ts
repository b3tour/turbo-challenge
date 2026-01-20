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
const CACHE_TTL = 60000; // 1 minuta

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
      return cached.data;
    }

    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, email, nick, phone, avatar_url, total_xp, level, class, is_admin, created_at, updated_at')
        .eq('id', userId)
        .maybeSingle();

      if (error || !data) {
        return null;
      }

      // Zapisz w cache
      profileCache[userId] = { data: data as User, timestamp: Date.now() };
      return data as User;
    } catch (e) {
      return null;
    }
  }, []);

  // Inicjalizacja - jednorazowo
  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();

      if (!mounted) return;

      let profile = null;
      if (session?.user) {
        profile = await fetchProfile(session.user.id);
      }

      setState({
        session,
        user: session?.user ?? null,
        profile,
        loading: false,
        error: null,
      });
    };

    initAuth();

    // Nasłuchuj zmian autoryzacji
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;

      // Ignoruj INITIAL_SESSION - już obsłużone powyżej
      if (event === 'INITIAL_SESSION') return;

      let profile = null;
      if (session?.user) {
        // Przy SIGNED_IN wymuś odświeżenie
        const forceRefresh = event === 'SIGNED_IN';
        profile = await fetchProfile(session.user.id, forceRefresh);
      } else {
        // Wyczyść cache przy wylogowaniu
        profileCache = {};
      }

      setState({
        session,
        user: session?.user ?? null,
        profile,
        loading: false,
        error: null,
      });
    });

    return () => {
      mounted = false;
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

  // Logowanie z hasłem
  const signInWithPassword = async (email: string, password: string) => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    const { error } = await supabase.auth.signInWithPassword({
      email,
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
    if (!state.user) return { success: false, error: 'Nie jesteś zalogowany' };

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

      const { data, error } = await supabase
        .from('users')
        .insert(newProfile)
        .select('id, email, nick, phone, avatar_url, total_xp, level, class, is_admin, created_at, updated_at')
        .single();

      if (error) {
        return { success: false, error: `Błąd tworzenia profilu: ${error.message}` };
      }

      // Zapisz w cache i stanie
      profileCache[state.user.id] = { data: data as User, timestamp: Date.now() };
      setState(prev => ({ ...prev, profile: data as User }));
      return { success: true, error: null };
    } catch (e) {
      return { success: false, error: 'Wystąpił nieoczekiwany błąd' };
    }
  };

  // Sprawdź czy nick jest dostępny (z prostym cache)
  const nickCheckCache: { [nick: string]: { available: boolean; timestamp: number } } = {};

  const checkNickAvailable = useCallback(async (nick: string): Promise<boolean> => {
    // Sprawdź cache (5 sekund)
    const cached = nickCheckCache[nick];
    if (cached && Date.now() - cached.timestamp < 5000) {
      return cached.available;
    }

    try {
      const { data } = await supabase
        .from('users')
        .select('id')
        .eq('nick', nick)
        .maybeSingle();

      const available = data === null;
      nickCheckCache[nick] = { available, timestamp: Date.now() };
      return available;
    } catch (e) {
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
