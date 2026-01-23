'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { LoadingScreen } from '@/components/layout';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isAuthenticated, hasProfile, profile, loading, refreshProfile } = useAuth();

  // Zapamiętaj że użytkownik był adminem - zapobiega wyrzuceniu przy tymczasowych błędach
  const wasAdminBefore = useRef(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const refreshAttempts = useRef(0);

  // Zapamiętaj status admina
  useEffect(() => {
    if (profile?.is_admin) {
      wasAdminBefore.current = true;
    }
  }, [profile?.is_admin]);

  useEffect(() => {
    if (loading || isRefreshing) return;

    // Jeśli użytkownik był adminem wcześniej, nie przekierowuj przy tymczasowych problemach
    if (wasAdminBefore.current && (!hasProfile || !profile)) {
      // Spróbuj odświeżyć profil zamiast przekierowywać
      if (refreshAttempts.current < 5) {
        refreshAttempts.current += 1;
        console.log('[AdminLayout] Admin stracił profil tymczasowo, odświeżam...', refreshAttempts.current);
        setIsRefreshing(true);
        setTimeout(async () => {
          await refreshProfile();
          setIsRefreshing(false);
        }, 1500);
        return;
      }
    }

    if (!isAuthenticated && !wasAdminBefore.current) {
      router.replace('/login');
      return;
    }

    if (!hasProfile && !wasAdminBefore.current) {
      router.replace('/onboarding');
      return;
    }

    if (profile && !profile.is_admin && !wasAdminBefore.current) {
      router.replace('/dashboard');
    }
  }, [isAuthenticated, hasProfile, profile, loading, router, refreshProfile, isRefreshing]);

  // Reset prób przy zmianie użytkownika
  useEffect(() => {
    if (profile?.id) {
      refreshAttempts.current = 0;
    }
  }, [profile?.id]);

  if (loading || isRefreshing) {
    return <LoadingScreen message="Ladowanie..." />;
  }

  // Jeśli użytkownik był adminem, nie pokazuj przekierowania - czekaj na odświeżenie
  if (wasAdminBefore.current && (!isAuthenticated || !hasProfile)) {
    return <LoadingScreen message="Odswiezanie sesji..." />;
  }

  if (!isAuthenticated || !hasProfile) {
    return <LoadingScreen message="Przekierowywanie..." />;
  }

  // Jeśli użytkownik był adminem, nie blokuj dostępu przy tymczasowym braku profilu
  if (!profile?.is_admin && !wasAdminBefore.current) {
    return <LoadingScreen message="Sprawdzanie uprawnien..." />;
  }

  return (
    <div className="min-h-screen bg-dark-900">
      {children}
    </div>
  );
}
