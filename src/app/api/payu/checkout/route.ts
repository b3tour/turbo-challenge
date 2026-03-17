import { NextRequest, NextResponse } from 'next/server';
import { createPayUOrderWithMethod } from '@/lib/payu';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { orderCode, amount, description, buyerEmail, orderType, payMethodType, payMethodValue } = body;

    if (!orderCode || !amount || !description || !buyerEmail) {
      return NextResponse.json(
        { error: 'Brak wymaganych danych zamówienia' },
        { status: 400 }
      );
    }

    const totalAmountGrosze = Math.round(amount * 100);

    if (totalAmountGrosze < 100) {
      return NextResponse.json(
        { error: 'Kwota musi wynosić minimum 1 PLN' },
        { status: 400 }
      );
    }

    const customerIp =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      request.headers.get('x-real-ip') ||
      '127.0.0.1';

    // Użyj APP_URL z env, fallback na główną domenę
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://challenge.turbopomoc.pl';

    // notifyUrl MUSI być publicznym adresem osiągalnym przez PayU
    // Nigdy nie może być localhost — PayU nie dotrze do lokalnego serwera
    const notifyUrl = `${appUrl}/api/payu/notify`;
    if (notifyUrl.includes('localhost') || notifyUrl.includes('127.0.0.1')) {
      console.error('PayU checkout: notifyUrl contains localhost! PayU will not be able to reach it.');
    }

    const continueUrl = orderType === 'card_order'
      ? `${appUrl}/cards?payment=success`
      : `${appUrl}/mystery?payment=success`;

    const payuResponse = await createPayUOrderWithMethod({
      extOrderId: orderCode,
      description: `Turbo Challenge - ${description}`,
      totalAmount: totalAmountGrosze,
      buyerEmail,
      productName: description,
      customerIp,
      continueUrl,
      notifyUrl,
      payMethodType: payMethodType || undefined,
      payMethodValue: payMethodValue || undefined,
    });

    return NextResponse.json({
      redirectUri: payuResponse.redirectUri,
      payuOrderId: payuResponse.orderId,
    });
  } catch (error) {
    console.error('PayU checkout error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Błąd tworzenia płatności' },
      { status: 500 }
    );
  }
}
