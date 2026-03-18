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

    const { orderId, extOrderId, status: orderStatus } = order;

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

// Obsługa zakończonej płatności za kartę — ATOMOWA TRANSAKCJA
async function handleCardOrderCompleted(cardOrder: {
  id: string;
  user_id: string;
  card_id: string;
  amount: number;
  xp_reward: number;
  status: string;
}, payuOrderId: string) {
  if (cardOrder.status !== 'pending') return;

  log('info', 'Processing card order (atomic)', { orderId: cardOrder.id, userId: cardOrder.user_id });

  const { data, error } = await supabase.rpc('complete_card_order', {
    p_order_id: cardOrder.id,
    p_payu_order_id: payuOrderId,
  });

  if (error) {
    log('error', 'Atomic complete_card_order failed', { error: error.message, orderId: cardOrder.id });
    return;
  }

  if (data && !data.success) {
    log('error', 'complete_card_order returned error', { error: data.error, orderId: cardOrder.id });
    return;
  }

  log('info', 'Card order completed successfully (atomic)', { orderId: cardOrder.id, userId: cardOrder.user_id });
}

// Obsługa zakończonej płatności za mystery pack — automatyczne otwarcie pakietu
async function handlePackOrderCompleted(packOrder: {
  id: string;
  user_id: string;
  pack_type_id: string;
  amount: number;
  status: string;
}, payuOrderId: string) {
  if (packOrder.status !== 'pending') return;

  log('info', 'Processing pack order — auto-open', { orderId: packOrder.id, userId: packOrder.user_id, packTypeId: packOrder.pack_type_id });

  // Pobierz typ pakietu
  const { data: packType, error: packTypeError } = await supabase
    .from('mystery_pack_types')
    .select('*')
    .eq('id', packOrder.pack_type_id)
    .single();

  if (packTypeError || !packType) {
    log('error', 'Pack type not found', { packTypeId: packOrder.pack_type_id });
    // Fallback: oznacz jako paid, admin otworzy ręcznie
    await supabase.from('mystery_pack_purchases').update({ status: 'paid', paid_at: new Date().toISOString() }).eq('id', packOrder.id);
    return;
  }

  // Pobierz dostępne karty
  const { data: availableCards } = await supabase
    .from('cards')
    .select('*')
    .eq('card_type', 'car')
    .eq('is_active', true);

  if (!availableCards || availableCards.length === 0) {
    log('error', 'No available cards for pack opening', { orderId: packOrder.id });
    await supabase.from('mystery_pack_purchases').update({ status: 'paid', paid_at: new Date().toISOString() }).eq('id', packOrder.id);
    return;
  }

  // Grupuj po rzadkości
  const cardsByRarity: Record<string, typeof availableCards> = {
    common: availableCards.filter(c => c.rarity === 'common'),
    rare: availableCards.filter(c => c.rarity === 'rare'),
    epic: availableCards.filter(c => c.rarity === 'epic'),
    legendary: availableCards.filter(c => c.rarity === 'legendary'),
  };

  const rollRarity = (): string => {
    const roll = Math.random() * 100;
    if (roll < (packType.legendary_chance || 3)) return 'legendary';
    if (roll < (packType.legendary_chance || 3) + (packType.epic_chance || 12)) return 'epic';
    if (roll < (packType.legendary_chance || 3) + (packType.epic_chance || 12) + (packType.rare_chance || 25)) return 'rare';
    return 'common';
  };

  // Losuj karty
  const cardCount = packType.card_count || 3;
  const selectedCards: typeof availableCards = [];

  for (let i = 0; i < cardCount; i++) {
    let targetRarity = rollRarity();

    if (packType.size === 'large' && i === cardCount - 1 &&
        !selectedCards.some(c => c.rarity === 'epic' || c.rarity === 'legendary')) {
      targetRarity = Math.random() < 0.3 ? 'legendary' : 'epic';
    }

    let pool = cardsByRarity[targetRarity];
    if (!pool || pool.length === 0) {
      for (const fallback of ['epic', 'rare', 'common']) {
        if (cardsByRarity[fallback] && cardsByRarity[fallback].length > 0) {
          pool = cardsByRarity[fallback];
          break;
        }
      }
    }

    if (pool && pool.length > 0) {
      selectedCards.push(pool[Math.floor(Math.random() * pool.length)]);
    }
  }

  // ATOMOWA TRANSAKCJA: karty + status + donation + XP + powiadomienie
  const cardIds = selectedCards.map(c => c.id);

  const { data: rpcResult, error: rpcError } = await supabase.rpc('complete_pack_order', {
    p_purchase_id: packOrder.id,
    p_card_ids: cardIds,
    p_amount: packOrder.amount,
    p_pack_name: packType.name,
  });

  if (rpcError) {
    log('error', 'Atomic complete_pack_order failed', { error: rpcError.message, orderId: packOrder.id });
    // Fallback: oznacz jako paid, admin otworzy ręcznie
    await supabase.from('mystery_pack_purchases').update({ status: 'paid', paid_at: new Date().toISOString() }).eq('id', packOrder.id);
    return;
  }

  if (rpcResult && !rpcResult.success) {
    log('error', 'complete_pack_order returned error', { error: rpcResult.error, orderId: packOrder.id });
    await supabase.from('mystery_pack_purchases').update({ status: 'paid', paid_at: new Date().toISOString() }).eq('id', packOrder.id);
    return;
  }

  log('info', 'Pack auto-opened successfully (atomic)', { orderId: packOrder.id, userId: packOrder.user_id, cards: selectedCards.length });
}
