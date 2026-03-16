'use client';

import { useState, useCallback } from 'react';

interface PayUCheckoutOptions {
  orderId: string;
  orderType: 'card_order' | 'mystery_pack';
  orderCode: string;
  amount: number;       // w PLN (np. 15)
  description: string;  // np. "Mystery Pack - Mały pakiet (3 karty)"
  buyerEmail: string;
}

export function usePayU() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startPayment = useCallback(async (opts: PayUCheckoutOptions): Promise<{ success: boolean; error?: string }> => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/payu/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(opts),
      });

      const data = await res.json();

      if (!res.ok) {
        const errMsg = data.error || 'Błąd tworzenia płatności';
        setError(errMsg);
        setLoading(false);
        return { success: false, error: errMsg };
      }

      if (data.redirectUri) {
        window.location.href = data.redirectUri;
        return { success: true };
      }

      setError('Brak linku do płatności');
      setLoading(false);
      return { success: false, error: 'Brak linku do płatności' };
    } catch (e) {
      const errMsg = 'Błąd połączenia z systemem płatności';
      setError(errMsg);
      setLoading(false);
      return { success: false, error: errMsg };
    }
  }, []);

  return {
    loading,
    error,
    startPayment,
  };
}
