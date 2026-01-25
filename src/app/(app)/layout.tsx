'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Header, BottomNav, LoadingScreen } from '@/components/layout';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isAuthenticated, hasProfile, profile, loading, refreshProfile, user, error } = useAuth();
  const refreshAttempts = useRef(0);
  const isRefreshingRef = useRef(false);
  const hadProfileBefore = useRef(false);
  const redirectingRef = useRef(false);
  const maxRetries = 3;

  // Zapamiętaj że użytkownik miał profil (zabezpieczenie przed fałszywym przekierowaniem)
  useEffect(() => {
    if (hasProfile) {
      hadProfileBefore.current = true;
      refreshAttempts.current = 0; // Reset prób gdy mamy profil
    }
  }, [hasProfile]);

  // Stabilna funkcja do odświeżania profilu
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
    // Czekaj aż loading się zakończy
    if (loading) return;

    // Jeśli już przekierowujemy lub odświeżamy - nie rób nic
    if (redirectingRef.current || isRefreshingRef.current) return;

    // Błąd połączenia - przekieruj do logowania, ale NIE jeśli użytkownik miał profil wcześniej
    if (error && !hadProfileBefore.current) {
      console.log('[Layout] Błąd auth, przekierowuję do login');
      redirectingRef.current = true;
      router.replace('/login');
      return;
    }

    // Nie zalogowany -> login
    if (!isAuthenticated) {
      console.log('[Layout] Brak sesji, przekierowuję do login');
      redirectingRef.current = true;
      router.replace('/login');
      return;
    }

    // Zalogowany ale bez profilu -> spróbuj odświeżyć lub przekieruj
    if (!hasProfile && user) {
      const actualMaxRetries = hadProfileBefore.current ? maxRetries + 2 : maxRetries;

      if (refreshAttempts.current < actualMaxRetries) {
        refreshAttempts.current += 1;
        console.log(`[Layout] Refresh profilu ${refreshAttempts.current}/${actualMaxRetries}`);

        // Użyj setTimeout aby nie blokować renderowania
        setTimeout(() => {
          tryRefreshProfile();
        }, 1000);
      } else if (!hadProfileBefore.current) {
        console.log('[Layout] Brak profilu, przekierowuję do onboarding');
        redirectingRef.current = true;
        router.replace('/onboarding');
      }
      // Jeśli użytkownik miał profil wcześniej - nie przekierowuj, poczekaj
    }
  }, [isAuthenticated, hasProfile, loading, router, user, error, tryRefreshProfile]);

  // Reset przy zmianie użytkownika
  useEffect(() => {
    if (user?.id) {
      refreshAttempts.current = 0;
      redirectingRef.current = false;
    }
  }, [user?.id]);

  // Pokaż loading tylko podczas inicjalnego ładowania auth
  if (loading) {
    return <LoadingScreen message="Ładowanie..." />;
  }

  // Brak sesji - przekierowanie do logowania
  if (!isAuthenticated) {
    return <LoadingScreen message="Przekierowywanie..." />;
  }

  // Brak profilu - pokaż loading tylko przy pierwszych próbach
  // Jeśli użytkownik miał profil wcześniej, nie pokazuj loading (może być tymczasowy problem)
  if (!hasProfile && !hadProfileBefore.current) {
    return <LoadingScreen message="Ładowanie profilu..." />;
  }

  return (
    <div className="min-h-screen">
      <Header user={profile} />
      <main className="pt-16 pb-20 px-4 max-w-lg mx-auto">{children}</main>
      <BottomNav />
    </div>
  );
}
