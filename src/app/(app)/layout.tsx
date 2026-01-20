'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Header, BottomNav, LoadingScreen } from '@/components/layout';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isAuthenticated, hasProfile, profile, loading, refreshProfile } = useAuth();
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    if (!loading) {
      if (!isAuthenticated) {
        router.push('/login');
      } else if (!hasProfile) {
        // Spróbuj odświeżyć profil przed przekierowaniem
        if (retryCount < 2) {
          console.log('Profile not found, retrying...', retryCount);
          setRetryCount(prev => prev + 1);
          refreshProfile();
        } else {
          console.log('Profile not found after retries, redirecting to onboarding');
          router.push('/onboarding');
        }
      }
    }
  }, [isAuthenticated, hasProfile, loading, router, retryCount, refreshProfile]);

  // Timeout - jeśli ładowanie trwa za długo, przekieruj
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (loading) {
        console.log('Loading timeout - forcing redirect');
        router.push('/login');
      }
    }, 10000); // 10 sekund timeout

    return () => clearTimeout(timeout);
  }, [loading, router]);

  if (loading || !isAuthenticated || !hasProfile) {
    return <LoadingScreen message={loading ? 'Ładowanie...' : 'Sprawdzanie profilu...'} />;
  }

  return (
    <div className="min-h-screen">
      <Header user={profile} />
      <main className="pt-16 pb-20 px-4 max-w-lg mx-auto">{children}</main>
      <BottomNav />
    </div>
  );
}
