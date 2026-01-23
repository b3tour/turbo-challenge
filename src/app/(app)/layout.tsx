'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Header, BottomNav, LoadingScreen } from '@/components/layout';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isAuthenticated, hasProfile, profile, loading, refreshProfile, user, error } = useAuth();
  const refreshAttempts = useRef(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [redirecting, setRedirecting] = useState(false);
  const maxRetries = 2; // Zmniejszone z 3

  useEffect(() => {
    // Czekaj aż loading się zakończy
    if (loading || isRefreshing || redirecting) return;

    // Błąd połączenia - przekieruj do logowania
    if (error) {
      console.log('[Layout] Błąd auth, przekierowuję do login');
      setRedirecting(true);
      router.replace('/login');
      return;
    }

    // Nie zalogowany -> login
    if (!isAuthenticated) {
      console.log('[Layout] Brak sesji, przekierowuję do login');
      setRedirecting(true);
      router.replace('/login');
      return;
    }

    // Zalogowany ale bez profilu -> spróbuj odświeżyć lub przekieruj
    if (!hasProfile && user) {
      if (refreshAttempts.current < maxRetries) {
        refreshAttempts.current += 1;
        console.log(`[Layout] Refresh profilu ${refreshAttempts.current}/${maxRetries}`);
        setIsRefreshing(true);

        setTimeout(async () => {
          await refreshProfile();
          setIsRefreshing(false);
        }, 1000);
      } else {
        console.log('[Layout] Brak profilu, przekierowuję do onboarding');
        setRedirecting(true);
        router.replace('/onboarding');
      }
    }
  }, [isAuthenticated, hasProfile, loading, router, refreshProfile, user, isRefreshing, error, redirecting]);

  // Reset prób przy zmianie użytkownika
  useEffect(() => {
    if (user?.id) {
      refreshAttempts.current = 0;
      setRedirecting(false);
    }
  }, [user?.id]);

  // Pokaż loading gdy się ładuje lub odświeża
  if (loading || isRefreshing) {
    return <LoadingScreen message={isRefreshing ? "Ładowanie profilu..." : "Ładowanie..."} />;
  }

  // Przekierowywanie w toku
  if (redirecting) {
    return <LoadingScreen message="Przekierowywanie..." />;
  }

  // Błąd - pokaż informację (zaraz nastąpi redirect)
  if (error || !isAuthenticated) {
    return <LoadingScreen message="Przekierowywanie..." />;
  }

  // Brak profilu ale mamy użytkownika - jeszcze próbujemy
  if (!hasProfile && user && refreshAttempts.current < maxRetries) {
    return <LoadingScreen message="Ładowanie profilu..." />;
  }

  // Brak profilu i wyczerpane próby - przekierowanie do onboarding
  if (!hasProfile) {
    return <LoadingScreen message="Przekierowywanie..." />;
  }

  return (
    <div className="min-h-screen">
      <Header user={profile} />
      <main className="pt-16 pb-20 px-4 max-w-lg mx-auto">{children}</main>
      <BottomNav />
    </div>
  );
}
