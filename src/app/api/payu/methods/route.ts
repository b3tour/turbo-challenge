import { NextResponse } from 'next/server';
import { getPaymentMethods } from '@/lib/payu';

// Cache metod płatności (odświeżanie co 5 minut)
let methodsCache: { data: unknown; expiresAt: number } | null = null;
const CACHE_TTL = 5 * 60 * 1000;

export async function GET() {
  try {
    if (methodsCache && Date.now() < methodsCache.expiresAt) {
      return NextResponse.json(methodsCache.data);
    }

    const categories = await getPaymentMethods();

    methodsCache = {
      data: { categories },
      expiresAt: Date.now() + CACHE_TTL,
    };

    return NextResponse.json({ categories });
  } catch (error) {
    console.error('PayU methods error:', error);
    return NextResponse.json(
      { error: 'Nie udało się pobrać metod płatności', categories: [] },
      { status: 500 }
    );
  }
}
