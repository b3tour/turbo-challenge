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

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://turbo-challenge.vercel.app';

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
      notifyUrl: `${appUrl}/api/payu/notify`,
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
