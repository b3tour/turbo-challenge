'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { CardOrder, CardOrderStatus } from '@/types';

interface UseCardOrdersOptions {
  userId?: string;
  loadAll?: boolean; // dla admina - załaduj wszystkie zamówienia
}

interface UseCardOrdersReturn {
  orders: CardOrder[];
  loading: boolean;
  error: string | null;
  createOrder: (cardId: string, amount: number, xpReward: number) => Promise<{ order: CardOrder | null; error: string | null }>;
  getUserOrderForCard: (cardId: string) => CardOrder | undefined;
  hasUserPurchasedCard: (cardId: string) => boolean;
  refreshOrders: () => Promise<void>;
}

// Generuj unikalny kod zamówienia
function generateOrderCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = 'TURBO-';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export function useCardOrders({ userId, loadAll = false }: UseCardOrdersOptions = {}): UseCardOrdersReturn {
  const [orders, setOrders] = useState<CardOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      let query = supabase
        .from('card_orders')
        .select('*, user:profiles(*), card:cards(*)')
        .order('created_at', { ascending: false });

      if (!loadAll && userId) {
        query = query.eq('user_id', userId);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) {
        console.error('Error fetching card orders:', fetchError);
        setOrders([]);
      } else {
        setOrders(data as CardOrder[]);
      }
    } catch (e) {
      console.error('Error in fetchOrders:', e);
      setError('Nie udało się pobrać zamówień');
    } finally {
      setLoading(false);
    }
  }, [userId, loadAll]);

  useEffect(() => {
    if (userId || loadAll) {
      fetchOrders();
    } else {
      setLoading(false);
    }
  }, [fetchOrders, userId, loadAll]);

  const createOrder = useCallback(async (
    cardId: string,
    amount: number,
    xpReward: number
  ): Promise<{ order: CardOrder | null; error: string | null }> => {
    if (!userId) {
      return { order: null, error: 'Musisz być zalogowany' };
    }

    // Sprawdź czy użytkownik już ma oczekujące zamówienie na tę kartę
    const existingOrder = orders.find(o => o.card_id === cardId && o.status === 'pending');
    if (existingOrder) {
      return { order: null, error: 'Masz już oczekujące zamówienie na tę kartę' };
    }

    // Sprawdź czy użytkownik już kupił tę kartę
    const paidOrder = orders.find(o => o.card_id === cardId && o.status === 'paid');
    if (paidOrder) {
      return { order: null, error: 'Już posiadasz tę kartę' };
    }

    const orderCode = generateOrderCode();

    const { data, error: insertError } = await supabase
      .from('card_orders')
      .insert({
        user_id: userId,
        card_id: cardId,
        order_code: orderCode,
        amount,
        xp_reward: xpReward,
        status: 'pending',
      })
      .select('*, card:cards(*)')
      .single();

    if (insertError) {
      console.error('Error creating order:', insertError);
      return { order: null, error: 'Nie udało się utworzyć zamówienia' };
    }

    setOrders(prev => [data as CardOrder, ...prev]);
    return { order: data as CardOrder, error: null };
  }, [userId, orders]);

  const getUserOrderForCard = useCallback((cardId: string) => {
    return orders.find(o => o.card_id === cardId);
  }, [orders]);

  const hasUserPurchasedCard = useCallback((cardId: string) => {
    return orders.some(o => o.card_id === cardId && o.status === 'paid');
  }, [orders]);

  return {
    orders,
    loading,
    error,
    createOrder,
    getUserOrderForCard,
    hasUserPurchasedCard,
    refreshOrders: fetchOrders,
  };
}
