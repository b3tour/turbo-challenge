'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { LoadingScreen } from '@/components/layout';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isAuthenticated, hasProfile, profile, loading, refreshProfile } = useAuth();

  const isRefreshingRef = useRef(false);
  const refreshAttempts = useRef(0);

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

    if (!isAuthenticated) {
      router.replace('/login');
      return;
    }

    if (!hasProfile) {
      // Spróbuj odświeżyć profil (może tymczasowy problem)
      if (refreshAttempts.current < 3) {
        refreshAttempts.current += 1;
        setTimeout(() => tryRefreshProfile(), 1000);
        return;
      }
      router.replace('/onboarding');
      return;
    }

    if (profile && !profile.is_admin) {
      router.replace('/dashboard');
    }
  }, [isAuthenticated, hasProfile, profile, loading, router, tryRefreshProfile]);

  useEffect(() => {
    if (profile?.id) {
      refreshAttempts.current = 0;
    }
  }, [profile?.id]);

  if (loading) {
    return <LoadingScreen message="Ladowanie..." />;
  }

  if (!isAuthenticated) {
    return <LoadingScreen message="Przekierowywanie..." />;
  }

  if (!hasProfile) {
    return <LoadingScreen message="Ladowanie profilu..." />;
  }

  if (!profile?.is_admin) {
    return <LoadingScreen message="Sprawdzanie uprawnien..." />;
  }

  return (
    <div className="min-h-screen bg-dark-900">
      {children}
    </div>
  );
}
