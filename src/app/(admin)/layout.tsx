'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { LoadingScreen } from '@/components/layout';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isAuthenticated, hasProfile, profile, loading, refreshProfile } = useAuth();

  // Zapamiętaj że użytkownik był adminem - zapobiega wyrzuceniu przy tymczasowych błędach
  const wasAdminBefore = useRef(false);
  const isRefreshingRef = useRef(false);
  const refreshAttempts = useRef(0);

  // Zapamiętaj status admina
  useEffect(() => {
    if (profile?.is_admin) {
      wasAdminBefore.current = true;
      refreshAttempts.current = 0;
    }
  }, [profile?.is_admin]);

  // Stabilna funkcja odświeżania
  const tryRefreshProfile = useCallback(async () => {
    if (isRefreshingRef.current) return;
    isRefreshingRef.current = true;
    try {
      await refreshProfile();
    } finally {
      isRefreshingRef.current = false;
    }
  }, [refreshProfile]);

  useEffect(() => {
    if (loading) return;

    // Jeśli użytkownik był adminem wcześniej i stracił profil tymczasowo
    if (wasAdminBefore.current && (!hasProfile || !profile) && refreshAttempts.current < 3) {
      refreshAttempts.current += 1;
      console.log('[AdminLayout] Admin stracił profil tymczasowo, odświeżam...', refreshAttempts.current);
      setTimeout(() => tryRefreshProfile(), 1000);
      return;
    }

    // Normalnie sprawdź uprawnienia tylko jeśli użytkownik NIE był adminem wcześniej
    if (!wasAdminBefore.current) {
      if (!isAuthenticated) {
        router.replace('/login');
        return;
      }

      if (!hasProfile) {
        router.replace('/onboarding');
        return;
      }

      if (profile && !profile.is_admin) {
        router.replace('/dashboard');
      }
    }
  }, [isAuthenticated, hasProfile, profile, loading, router, tryRefreshProfile]);

  // Reset prób przy zmianie użytkownika
  useEffect(() => {
    if (profile?.id) {
      refreshAttempts.current = 0;
    }
  }, [profile?.id]);

  // Pokaż loading tylko podczas inicjalnego ładowania
  if (loading) {
    return <LoadingScreen message="Ladowanie..." />;
  }

  // Brak sesji
  if (!isAuthenticated) {
    return <LoadingScreen message="Przekierowywanie..." />;
  }

  // Brak profilu (ale jeśli był adminem, nie pokazuj loading)
  if (!hasProfile && !wasAdminBefore.current) {
    return <LoadingScreen message="Przekierowywanie..." />;
  }

  // Nie admin (ale jeśli był adminem, pozwól zostać)
  if (!profile?.is_admin && !wasAdminBefore.current) {
    return <LoadingScreen message="Sprawdzanie uprawnien..." />;
  }

  return (
    <div className="min-h-screen bg-dark-900">
      {children}
    </div>
  );
}
