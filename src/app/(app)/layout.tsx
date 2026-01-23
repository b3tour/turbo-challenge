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
  const hadProfileBefore = useRef(false); // Zapamiętaj czy użytkownik miał profil
  const maxRetries = 3;

  // Zapamiętaj że użytkownik miał profil (zabezpieczenie przed fałszywym przekierowaniem)
  useEffect(() => {
    if (hasProfile) {
      hadProfileBefore.current = true;
    }
  }, [hasProfile]);

  useEffect(() => {
    // Czekaj aż loading się zakończy
    if (loading || isRefreshing || redirecting) return;

    // Błąd połączenia - przekieruj do logowania, ale NIE jeśli to tylko tymczasowy błąd
    if (error && !hadProfileBefore.current) {
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
    // Dodatkowe zabezpieczenie: jeśli użytkownik miał profil wcześniej, daj więcej prób
    if (!hasProfile && user) {
      const actualMaxRetries = hadProfileBefore.current ? maxRetries + 2 : maxRetries;

      if (refreshAttempts.current < actualMaxRetries) {
        refreshAttempts.current += 1;
        console.log(`[Layout] Refresh profilu ${refreshAttempts.current}/${actualMaxRetries}`);
        setIsRefreshing(true);

        setTimeout(async () => {
          await refreshProfile();
          setIsRefreshing(false);
        }, 1500); // Dłuższy timeout dla lepszej stabilności
      } else {
        // Jeśli użytkownik miał profil wcześniej, to może być tymczasowy problem - nie przekierowuj od razu
        if (hadProfileBefore.current) {
          console.log('[Layout] Brak profilu ale użytkownik miał go wcześniej - poczekaj');
          // Ostatnia próba po 3 sekundach
          setTimeout(async () => {
            await refreshProfile();
            // Jeśli nadal nie ma profilu, to rzeczywiście coś jest nie tak
            // Ale nie przekierowujemy - zostawiamy użytkownika na stronie
          }, 3000);
        } else {
          console.log('[Layout] Brak profilu, przekierowuję do onboarding');
          setRedirecting(true);
          router.replace('/onboarding');
        }
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
