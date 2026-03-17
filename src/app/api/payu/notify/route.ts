import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifyPayUSignature } from '@/lib/payu';

// Service Role client — omija RLS, wymagany bo webhook PayU nie ma sesji użytkownika
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

function log(level: 'info' | 'error' | 'warn', msg: string, data?: Record<string, unknown>) {
  const entry = { timestamp: new Date().toISOString(), source: 'payu-notify', msg, ...data };
  if (level === 'error') console.error(JSON.stringify(entry));
  else if (level === 'warn') console.warn(JSON.stringify(entry));
  else console.log(JSON.stringify(entry));
}

export async function POST(request: NextRequest) {
  try {
    // Sprawdź czy service role key jest skonfigurowany
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      log('error', 'SUPABASE_SERVICE_ROLE_KEY not configured — webhook cannot update database');
      return NextResponse.json({ status: 'OK' });
    }

    const rawBody = await request.text();
    const signatureHeader = request.headers.get('OpenPayu-Signature') || '';

    // Weryfikacja podpisu
    if (!verifyPayUSignature(rawBody, signatureHeader)) {
      log('error', 'Invalid PayU signature', { signatureHeader });
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const payload = JSON.parse(rawBody);
    const order = payload.order;

    if (!order) {
      log('error', 'Missing order data in payload');
      return NextResponse.json({ error: 'Missing order data' }, { status: 400 });
    }

    const { orderId, extOrderId, orderStatus } = order;

    log('info', 'Received PayU notification', { orderId, extOrderId, orderStatus });

    if (orderStatus === 'COMPLETED') {
      // Spróbuj znaleźć w card_orders
      const { data: cardOrder, error: cardQueryError } = await supabase
        .from('card_orders')
        .select('id, user_id, card_id, amount, xp_reward, status')
        .eq('order_code', extOrderId)
        .eq('status', 'pending')
        .maybeSingle();

      if (cardQueryError) {
        log('error', 'Error querying card_orders', { error: cardQueryError.message, extOrderId });
      }

      if (cardOrder) {
        await handleCardOrderCompleted(cardOrder, orderId);
        return NextResponse.json({ status: 'OK' });
      }

      // Spróbuj znaleźć w mystery_pack_purchases
      const { data: packOrder, error: packQueryError } = await supabase
        .from('mystery_pack_purchases')
        .select('id, user_id, pack_type_id, amount, status, order_code')
        .eq('order_code', extOrderId)
        .eq('status', 'pending')
        .maybeSingle();

      if (packQueryError) {
        log('error', 'Error querying mystery_pack_purchases', { error: packQueryError.message, extOrderId });
      }

      if (packOrder) {
        await handlePackOrderCompleted(packOrder, orderId);
        return NextResponse.json({ status: 'OK' });
      }

      // Fallback: szukaj po payuOrderId w admin_notes
      const { data: cardByPayu } = await supabase
        .from('card_orders')
        .select('id, user_id, card_id, amount, xp_reward, status')
        .like('admin_notes', `payu:${orderId}`)
        .eq('status', 'pending')
        .maybeSingle();

      if (cardByPayu) {
        await handleCardOrderCompleted(cardByPayu, orderId);
        return NextResponse.json({ status: 'OK' });
      }

      const { data: packByPayu } = await supabase
        .from('mystery_pack_purchases')
        .select('id, user_id, pack_type_id, amount, status, order_code')
        .like('admin_notes', `payu:${orderId}`)
        .eq('status', 'pending')
        .maybeSingle();

      if (packByPayu) {
        await handlePackOrderCompleted(packByPayu, orderId);
        return NextResponse.json({ status: 'OK' });
      }

      log('warn', 'Order not found for COMPLETED notification', { extOrderId, orderId });
    }

    if (orderStatus === 'CANCELED' || orderStatus === 'REJECTED' || orderStatus === 'EXPIRED') {
      log('info', 'Cancelling order', { extOrderId, orderStatus });

      const { error: cancelCardError } = await supabase
        .from('card_orders')
        .update({ status: 'cancelled' })
        .eq('order_code', extOrderId)
        .eq('status', 'pending');

      if (cancelCardError) {
        log('error', 'Error cancelling card_order', { error: cancelCardError.message, extOrderId });
      }

      const { error: cancelPackError } = await supabase
        .from('mystery_pack_purchases')
        .update({ status: 'cancelled' })
        .eq('order_code', extOrderId)
        .eq('status', 'pending');

      if (cancelPackError) {
        log('error', 'Error cancelling mystery_pack_purchase', { error: cancelPackError.message, extOrderId });
      }
    }

    // PENDING / WAITING_FOR_CONFIRMATION — ignorujemy, czekamy na COMPLETED
    return NextResponse.json({ status: 'OK' });
  } catch (error) {
    log('error', 'Unhandled error in PayU notify', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    // Zwracamy 200 żeby PayU nie ponawiało — błąd jest zalogowany
    return NextResponse.json({ status: 'OK' });
  }
}

// Obsługa zakończonej płatności za kartę
async function handleCardOrderCompleted(cardOrder: {
  id: string;
  user_id: string;
  card_id: string;
  amount: number;
  xp_reward: number;
  status: string;
}, payuOrderId: string) {
  if (cardOrder.status !== 'pending') return;

  log('info', 'Processing card order', { orderId: cardOrder.id, userId: cardOrder.user_id });

  // Oznacz jako opłacone
  const { error: updateError } = await supabase
    .from('card_orders')
    .update({
      status: 'paid',
      paid_at: new Date().toISOString(),
      admin_notes: `payu:${payuOrderId}`,
    })
    .eq('id', cardOrder.id)
    .eq('status', 'pending');

  if (updateError) {
    log('error', 'Failed to update card_order status', { error: updateError.message, orderId: cardOrder.id });
    return;
  }

  // Dodaj kartę do kolekcji użytkownika
  const { error: insertCardError } = await supabase
    .from('user_cards')
    .insert({
      user_id: cardOrder.user_id,
      card_id: cardOrder.card_id,
      obtained_from: 'purchase',
    });

  if (insertCardError) {
    log('error', 'Failed to insert user_card', { error: insertCardError.message, orderId: cardOrder.id });
  }

  // Dodaj do donation_total
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('donation_total')
    .eq('id', cardOrder.user_id)
    .single();

  if (userError) {
    log('error', 'Failed to fetch user for donation update', { error: userError.message, userId: cardOrder.user_id });
  } else if (userData) {
    const { error: donationError } = await supabase
      .from('users')
      .update({ donation_total: (userData.donation_total || 0) + cardOrder.amount })
      .eq('id', cardOrder.user_id);

    if (donationError) {
      log('error', 'Failed to update donation_total', { error: donationError.message, userId: cardOrder.user_id });
    }
  }

  // Dodaj XP
  if (cardOrder.xp_reward > 0) {
    const { error: xpError } = await supabase.rpc('add_user_xp', {
      p_user_id: cardOrder.user_id,
      p_xp_amount: cardOrder.xp_reward,
    });

    if (xpError) {
      log('error', 'Failed to add XP', { error: xpError.message, userId: cardOrder.user_id });
    }
  }

  // Aktualizuj sold_count na karcie
  const { data: card } = await supabase
    .from('cards')
    .select('sold_count')
    .eq('id', cardOrder.card_id)
    .single();

  if (card) {
    await supabase
      .from('cards')
      .update({ sold_count: (card.sold_count || 0) + 1 })
      .eq('id', cardOrder.card_id);
  }

  // Wyślij powiadomienie
  const { error: notifError } = await supabase.from('notifications').insert({
    user_id: cardOrder.user_id,
    title: 'Płatność potwierdzona!',
    message: 'Twoja karta została dodana do kolekcji. Dziękujemy za wsparcie Turbo Pomoc!',
    type: 'card_received',
    read: false,
  });

  if (notifError) {
    log('error', 'Failed to send notification', { error: notifError.message, userId: cardOrder.user_id });
  }

  log('info', 'Card order completed successfully', { orderId: cardOrder.id, userId: cardOrder.user_id });
}

// Obsługa zakończonej płatności za mystery pack
async function handlePackOrderCompleted(packOrder: {
  id: string;
  user_id: string;
  pack_type_id: string;
  amount: number;
  status: string;
}, payuOrderId: string) {
  if (packOrder.status !== 'pending') return;

  log('info', 'Processing pack order', { orderId: packOrder.id, userId: packOrder.user_id });

  // Oznacz jako opłacone
  const { error: updateError } = await supabase
    .from('mystery_pack_purchases')
    .update({
      status: 'paid',
      paid_at: new Date().toISOString(),
    })
    .eq('id', packOrder.id)
    .eq('status', 'pending');

  if (updateError) {
    log('error', 'Failed to update mystery_pack_purchase status', { error: updateError.message, orderId: packOrder.id });
    return;
  }

  // Dodaj do donation_total
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('donation_total')
    .eq('id', packOrder.user_id)
    .single();

  if (userError) {
    log('error', 'Failed to fetch user for donation update', { error: userError.message, userId: packOrder.user_id });
  } else if (userData) {
    const { error: donationError } = await supabase
      .from('users')
      .update({ donation_total: (userData.donation_total || 0) + packOrder.amount })
      .eq('id', packOrder.user_id);

    if (donationError) {
      log('error', 'Failed to update donation_total', { error: donationError.message, userId: packOrder.user_id });
    }
  }

  // Wyślij powiadomienie
  const { error: notifError } = await supabase.from('notifications').insert({
    user_id: packOrder.user_id,
    title: 'Płatność za pakiet potwierdzona!',
    message: 'Twój pakiet Mystery Garage został opłacony. Otwórz go w zakładce Mystery Garage!',
    type: 'card_received',
    read: false,
  });

  if (notifError) {
    log('error', 'Failed to send pack notification', { error: notifError.message, userId: packOrder.user_id });
  }

  log('info', 'Pack order completed successfully', { orderId: packOrder.id, userId: packOrder.user_id });
}
