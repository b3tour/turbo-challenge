import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifyPayUSignature } from '@/lib/payu';

// Service-level client — używa anon key + RLS, ale callback wymaga UPDATE access
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const signatureHeader = request.headers.get('OpenPayu-Signature') || '';

    // Weryfikacja podpisu
    if (!verifyPayUSignature(rawBody, signatureHeader)) {
      console.error('PayU notify: invalid signature');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const payload = JSON.parse(rawBody);
    const order = payload.order;

    if (!order) {
      return NextResponse.json({ error: 'Missing order data' }, { status: 400 });
    }

    const { orderId, extOrderId, orderStatus } = order;

    console.log(`PayU notify: orderId=${orderId}, extOrderId=${extOrderId}, status=${orderStatus}`);

    // Szukaj zamówienia po extOrderId (nasz order_code) lub po payuOrderId w admin_notes
    if (orderStatus === 'COMPLETED') {
      // Spróbuj znaleźć w card_orders
      const { data: cardOrder } = await supabase
        .from('card_orders')
        .select('id, user_id, card_id, amount, xp_reward, status')
        .eq('order_code', extOrderId)
        .eq('status', 'pending')
        .maybeSingle();

      if (cardOrder) {
        await handleCardOrderCompleted(cardOrder);
        return NextResponse.json({ status: 'OK' });
      }

      // Spróbuj znaleźć w mystery_pack_purchases
      const { data: packOrder } = await supabase
        .from('mystery_pack_purchases')
        .select('id, user_id, pack_type_id, amount, status, order_code')
        .eq('order_code', extOrderId)
        .eq('status', 'pending')
        .maybeSingle();

      if (packOrder) {
        await handlePackOrderCompleted(packOrder);
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
        await handleCardOrderCompleted(cardByPayu);
        return NextResponse.json({ status: 'OK' });
      }

      const { data: packByPayu } = await supabase
        .from('mystery_pack_purchases')
        .select('id, user_id, pack_type_id, amount, status, order_code')
        .like('admin_notes', `payu:${orderId}`)
        .eq('status', 'pending')
        .maybeSingle();

      if (packByPayu) {
        await handlePackOrderCompleted(packByPayu);
        return NextResponse.json({ status: 'OK' });
      }

      console.error(`PayU notify: order not found for extOrderId=${extOrderId}, payuOrderId=${orderId}`);
    }

    if (orderStatus === 'CANCELED' || orderStatus === 'REJECTED' || orderStatus === 'EXPIRED') {
      // Anuluj zamówienie
      await supabase
        .from('card_orders')
        .update({ status: 'cancelled' })
        .eq('order_code', extOrderId)
        .eq('status', 'pending');

      await supabase
        .from('mystery_pack_purchases')
        .update({ status: 'cancelled' })
        .eq('order_code', extOrderId)
        .eq('status', 'pending');
    }

    // PayU wymaga odpowiedzi 200 OK
    return NextResponse.json({ status: 'OK' });
  } catch (error) {
    console.error('PayU notify error:', error);
    // Zwracamy 200 żeby PayU nie ponawiało — logujemy błąd
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
}) {
  // Idempotency: sprawdź czy już nie przetworzone
  if (cardOrder.status !== 'pending') return;

  // Oznacz jako opłacone
  const { error: updateError } = await supabase
    .from('card_orders')
    .update({
      status: 'paid',
      paid_at: new Date().toISOString(),
    })
    .eq('id', cardOrder.id)
    .eq('status', 'pending'); // Dodatkowe zabezpieczenie przed race condition

  if (updateError) {
    console.error('PayU: card order update error:', updateError);
    return;
  }

  // Dodaj kartę do kolekcji użytkownika
  await supabase
    .from('user_cards')
    .insert({
      user_id: cardOrder.user_id,
      card_id: cardOrder.card_id,
      obtained_from: 'purchase',
    });

  // Dodaj XP
  if (cardOrder.xp_reward > 0) {
    await supabase.rpc('add_user_xp', {
      p_user_id: cardOrder.user_id,
      p_xp_amount: cardOrder.xp_reward,
    });
  }

  // Aktualizuj donation_total
  await supabase.rpc('add_user_xp', {
    p_user_id: cardOrder.user_id,
    p_xp_amount: 0, // tylko trigger na donation
  });

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
  await supabase.from('notifications').insert({
    user_id: cardOrder.user_id,
    title: 'Płatność potwierdzona!',
    message: `Twoja karta została dodana do kolekcji. Dziękujemy za wsparcie Turbo Pomoc!`,
    type: 'card_received',
    read: false,
  });

  console.log(`PayU: card order ${cardOrder.id} completed for user ${cardOrder.user_id}`);
}

// Obsługa zakończonej płatności za mystery pack
async function handlePackOrderCompleted(packOrder: {
  id: string;
  user_id: string;
  pack_type_id: string;
  amount: number;
  status: string;
}) {
  if (packOrder.status !== 'pending') return;

  // Oznacz jako opłacone (admin otworzy pakiet ręcznie lub automatycznie)
  const { error: updateError } = await supabase
    .from('mystery_pack_purchases')
    .update({
      status: 'paid',
      paid_at: new Date().toISOString(),
    })
    .eq('id', packOrder.id)
    .eq('status', 'pending');

  if (updateError) {
    console.error('PayU: pack order update error:', updateError);
    return;
  }

  // Wyślij powiadomienie
  await supabase.from('notifications').insert({
    user_id: packOrder.user_id,
    title: 'Płatność za pakiet potwierdzona!',
    message: 'Twój pakiet Mystery Garage został opłacony. Otwórz go w zakładce Mystery Garage!',
    type: 'card_received',
    read: false,
  });

  console.log(`PayU: pack order ${packOrder.id} completed for user ${packOrder.user_id}`);
}
