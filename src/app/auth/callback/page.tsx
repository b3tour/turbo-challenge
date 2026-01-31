'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function AuthCallbackPage() {
  const router = useRouter();
  const handled = useRef(false);

  useEffect(() => {
    if (handled.current) return;
    handled.current = true;

    const handleCallback = async () => {
      try {
        // Supabase client z detectSessionInUrl: true automatycznie
        // wykryje code w URL i wymieni go na sesję (PKCE flow)
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
          console.error('[Auth Callback] Błąd sesji:', error.message);
          router.replace('/login?error=auth_failed');
          return;
        }

        if (session) {
          // Sesja istnieje - sprawdź czy użytkownik ma profil
          const { data: profile } = await supabase
            .from('users')
            .select('id')
            .eq('id', session.user.id)
            .maybeSingle();

          if (profile) {
            router.replace('/dashboard');
          } else {
            router.replace('/onboarding');
          }
        } else {
          // Brak sesji - spróbuj poczekać na auth state change
          const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, newSession) => {
              if (event === 'SIGNED_IN' && newSession) {
                subscription.unsubscribe();

                const { data: profile } = await supabase
                  .from('users')
                  .select('id')
                  .eq('id', newSession.user.id)
                  .maybeSingle();

                if (profile) {
                  router.replace('/dashboard');
                } else {
                  router.replace('/onboarding');
                }
              }
            }
          );

          // Timeout - jeśli po 5s nic się nie stało, wróć do login
          setTimeout(() => {
            subscription.unsubscribe();
            router.replace('/login?error=timeout');
          }, 5000);
        }
      } catch (err) {
        console.error('[Auth Callback] Nieoczekiwany błąd:', err);
        router.replace('/login?error=unexpected');
      }
    };

    handleCallback();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-turbo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-dark-400">Logowanie...</p>
      </div>
    </div>
  );
}
