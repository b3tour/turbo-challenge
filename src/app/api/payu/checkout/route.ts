import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createPayUOrder } from '@/lib/payu';

// Server-side Supabase client (service role would be ideal, but anon + RLS works for reads)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { orderId, orderType } = body;
    // orderType: 'card_order' | 'mystery_pack'

    if (!orderId || !orderType) {
      return NextResponse.json({ error: 'Brak orderId lub orderType' }, { status: 400 });
    }

    // Pobierz zamówienie z bazy
    let order: Record<string, unknown> | null = null;
    let description = '';
    let productName = '';
    let totalAmountGrosze = 0;
    let buyerEmail = '';

    if (orderType === 'card_order') {
      const { data, error } = await supabase
        .from('card_orders')
        .select('*, card:cards(name, rarity), user:users(email, phone)')
        .eq('id', orderId)
        .eq('status', 'pending')
        .single();

      if (error || !data) {
        return NextResponse.json({ error: 'Zamówienie nie znalezione lub już opłacone' }, { status: 404 });
      }

      order = data;
      const card = data.card as Record<string, unknown> | null;
      const user = data.user as Record<string, unknown> | null;
      description = `Turbo Challenge - Karta ${card?.name || 'kolekcjonerska'}`;
      productName = `Karta: ${card?.name || 'Kolekcjonerska'} (${card?.rarity || ''})`;
      totalAmountGrosze = Math.round((data.amount as number) * 100);
      buyerEmail = (user?.email as string) || '';
    } else if (orderType === 'mystery_pack') {
      const { data, error } = await supabase
        .from('mystery_pack_purchases')
        .select('*, pack_type:mystery_pack_types(name, card_count, price), user:users(email, phone)')
        .eq('id', orderId)
        .eq('status', 'pending')
        .single();

      if (error || !data) {
        return NextResponse.json({ error: 'Zamówienie pakietu nie znalezione lub już opłacone' }, { status: 404 });
      }

      order = data;
      const packType = data.pack_type as Record<string, unknown> | null;
      const user = data.user as Record<string, unknown> | null;
      description = `Turbo Challenge - ${packType?.name || 'Mystery Garage'}`;
      productName = `${packType?.name || 'Mystery Pack'} (${packType?.card_count || '?'} kart)`;
      totalAmountGrosze = Math.round((data.amount as number) * 100);
      buyerEmail = (user?.email as string) || '';
    } else {
      return NextResponse.json({ error: 'Nieznany typ zamówienia' }, { status: 400 });
    }

    if (totalAmountGrosze < 100) {
      return NextResponse.json({ error: 'Kwota musi wynosić minimum 1 PLN' }, { status: 400 });
    }

    // Pobierz IP klienta
    const customerIp = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      || request.headers.get('x-real-ip')
      || '127.0.0.1';

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://turbo-challenge.vercel.app';
    const extOrderId = (order as Record<string, unknown>).order_code as string || orderId;

    // Utwórz płatność w PayU
    const payuResponse = await createPayUOrder({
      extOrderId,
      description,
      totalAmount: totalAmountGrosze,
      buyerEmail,
      productName,
      customerIp,
      continueUrl: `${appUrl}/mystery?payment=success`,
      notifyUrl: `${appUrl}/api/payu/notify`,
    });

    // Zapisz PayU orderId w bazie (do późniejszego mapowania callbacku)
    if (orderType === 'card_order') {
      await supabase
        .from('card_orders')
        .update({ admin_notes: `payu:${payuResponse.orderId}` })
        .eq('id', orderId);
    } else {
      await supabase
        .from('mystery_pack_purchases')
        .update({ admin_notes: `payu:${payuResponse.orderId}` })
        .eq('id', orderId);
    }

    return NextResponse.json({
      redirectUri: payuResponse.redirectUri,
      payuOrderId: payuResponse.orderId,
    });
  } catch (error) {
    console.error('PayU checkout error:', error);
    return NextResponse.json(
      { error: 'Błąd tworzenia płatności. Spróbuj ponownie.' },
      { status: 500 }
    );
  }
}
