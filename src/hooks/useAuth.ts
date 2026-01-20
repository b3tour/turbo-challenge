'use client';

import { useEffect, useState, useCallback } from 'react';
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

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    session: null,
    user: null,
    profile: null,
    loading: true,
    error: null,
  });

  // Pobierz profil użytkownika z bazy (używa RPC dla pewności)
  const fetchProfile = useCallback(async (userId: string) => {
    console.log('=== fetchProfile START ===', userId);
    try {
      // Najpierw spróbuj przez RPC
      console.log('Trying RPC get_user_profile...');
      const { data: rpcData, error: rpcError } = await supabase
        .rpc('get_user_profile', { p_user_id: userId });

      console.log('RPC result:', { rpcData, rpcError });

      if (!rpcError && rpcData && rpcData.length > 0) {
        console.log('Profile found via RPC:', rpcData[0]);
        return rpcData[0] as User;
      }

      // Fallback do bezpośredniego zapytania
      console.log('Trying direct query...');
      const { data, error } = await supabase
        .from('users')
        .select('id, email, nick, phone, avatar_url, total_xp, level, class, is_admin, created_at, updated_at')
        .eq('id', userId)
        .maybeSingle();

      console.log('Direct query result:', { data, error });

      if (error) {
        console.error('Error fetching profile:', error.message, error.code);
        return null;
      }

      console.log('=== fetchProfile END ===', data);
      return data as User | null;
    } catch (e) {
      console.error('Exception fetching profile:', e);
      return null;
    }
  }, []);

  // Inicjalizacja i nasłuchiwanie zmian sesji
  useEffect(() => {
    console.log('=== useAuth INIT ===');
    // Pobierz aktualną sesję
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      console.log('getSession result:', session ? 'logged in' : 'not logged in', session?.user?.id);
      let profile = null;
      if (session?.user) {
        profile = await fetchProfile(session.user.id);
        console.log('Profile after fetch:', profile);
      }

      console.log('Setting state - hasProfile:', !!profile);
      setState({
        session,
        user: session?.user ?? null,
        profile,
        loading: false,
        error: null,
      });
    });

    // Nasłuchuj zmian autoryzacji
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
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
    });

    return () => subscription.unsubscribe();
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

    setState(prev => ({ ...prev, profile: data as User }));
    return { success: true, error: null };
  };

  // Utwórz profil (po pierwszym logowaniu) - używa RPC dla pewności
  const createProfile = async (nick: string, phone?: string) => {
    if (!state.user) return { success: false, error: 'Nie jesteś zalogowany' };

    console.log('Creating profile for user:', state.user.id, 'with nick:', nick);

    try {
      // Spróbuj przez RPC
      const { data: rpcData, error: rpcError } = await supabase
        .rpc('create_user_profile', {
          p_id: state.user.id,
          p_email: state.user.email!,
          p_nick: nick,
          p_phone: phone || null
        });

      if (!rpcError && rpcData && rpcData.length > 0) {
        console.log('Profile created via RPC:', rpcData[0]);
        setState(prev => ({ ...prev, profile: rpcData[0] as User }));
        return { success: true, error: null };
      }

      if (rpcError) {
        console.log('RPC error, trying direct insert:', rpcError.message);
      }

      // Fallback do bezpośredniego INSERT
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
        console.error('Error creating profile:', error.message, error.code, error.details);
        return { success: false, error: `Błąd tworzenia profilu: ${error.message}` };
      }

      console.log('Profile created via direct insert:', data);
      setState(prev => ({ ...prev, profile: data as User }));
      return { success: true, error: null };
    } catch (e) {
      console.error('Exception creating profile:', e);
      return { success: false, error: 'Wystąpił nieoczekiwany błąd' };
    }
  };

  // Sprawdź czy nick jest dostępny (używa RPC dla pewności)
  const checkNickAvailable = useCallback(async (nick: string): Promise<boolean> => {
    console.log('=== checkNickAvailable ===', nick);
    try {
      const { data: rpcData, error: rpcError } = await supabase
        .rpc('check_nick_available', { p_nick: nick });

      if (!rpcError && typeof rpcData === 'boolean') {
        console.log('Nick available:', rpcData);
        return rpcData;
      }

      // Fallback
      const { data } = await supabase
        .from('users')
        .select('id')
        .eq('nick', nick)
        .maybeSingle();

      return data === null;
    } catch (e) {
      console.error('Exception checking nick:', e);
      return true;
    }
  }, []);

  // Odśwież profil
  const refreshProfile = async () => {
    if (!state.user) return;
    const profile = await fetchProfile(state.user.id);
    setState(prev => ({ ...prev, profile }));
  };

  return {
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
}
