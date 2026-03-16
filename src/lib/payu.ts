// PayU REST API helper — server-side only (used in API routes)
import crypto from 'crypto';

const PAYU_BASE_URL = process.env.PAYU_BASE_URL || 'https://secure.payu.com';
const PAYU_CLIENT_ID = process.env.PAYU_CLIENT_ID || '';
const PAYU_CLIENT_SECRET = process.env.PAYU_CLIENT_SECRET || '';
const PAYU_POS_ID = process.env.PAYU_POS_ID || '';
const PAYU_MD5_KEY = process.env.PAYU_MD5_KEY || '';

// Cache access token in memory (server-side singleton)
let tokenCache: { token: string; expiresAt: number } | null = null;

export async function getAccessToken(): Promise<string> {
  // Return cached token if still valid (with 60s buffer)
  if (tokenCache && Date.now() < tokenCache.expiresAt - 60000) {
    return tokenCache.token;
  }

  const res = await fetch(`${PAYU_BASE_URL}/pl/standard/user/oauth/authorize`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: PAYU_CLIENT_ID,
      client_secret: PAYU_CLIENT_SECRET,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`PayU OAuth failed: ${res.status} ${text}`);
  }

  const data = await res.json();
  tokenCache = {
    token: data.access_token,
    expiresAt: Date.now() + data.expires_in * 1000,
  };

  return data.access_token;
}

export interface PayUOrderRequest {
  extOrderId: string;
  description: string;
  totalAmount: number; // w groszach (4900 = 49.00 PLN)
  buyerEmail: string;
  buyerPhone?: string;
  productName: string;
  customerIp: string;
  continueUrl: string; // URL powrotu po płatności
  notifyUrl: string;   // URL callbacku
}

export interface PayUOrderResponse {
  status: { statusCode: string };
  redirectUri: string;
  orderId: string;
  extOrderId: string;
}

export async function createPayUOrder(order: PayUOrderRequest): Promise<PayUOrderResponse> {
  const token = await getAccessToken();

  const body = {
    notifyUrl: order.notifyUrl,
    continueUrl: order.continueUrl,
    customerIp: order.customerIp,
    merchantPosId: PAYU_POS_ID,
    description: order.description,
    currencyCode: 'PLN',
    totalAmount: order.totalAmount.toString(),
    extOrderId: order.extOrderId,
    buyer: {
      email: order.buyerEmail,
      ...(order.buyerPhone ? { phone: order.buyerPhone } : {}),
    },
    products: [
      {
        name: order.productName,
        unitPrice: order.totalAmount.toString(),
        quantity: '1',
      },
    ],
    settings: {
      invoiceDisabled: true,
    },
  };

  const res = await fetch(`${PAYU_BASE_URL}/api/v2_1/orders`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
    redirect: 'manual', // PayU returns 302 redirect — we want to capture it
  });

  // PayU returns 302 with Location header + JSON body
  if (res.status === 302 || res.status === 301) {
    const redirectUri = res.headers.get('Location') || '';
    const responseBody = await res.json().catch(() => ({}));
    return {
      status: responseBody.status || { statusCode: 'SUCCESS' },
      redirectUri,
      orderId: responseBody.orderId || '',
      extOrderId: order.extOrderId,
    };
  }

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`PayU create order failed: ${res.status} ${text}`);
  }

  return await res.json();
}

// Weryfikacja podpisu IPN od PayU
export function verifyPayUSignature(rawBody: string, signatureHeader: string): boolean {
  if (!signatureHeader) return false;

  // Format: "sender=checkout;signature=HASH;algorithm=MD5;content=BODY"
  const parts: Record<string, string> = {};
  signatureHeader.split(';').forEach(part => {
    const [key, ...valueParts] = part.split('=');
    parts[key] = valueParts.join('=');
  });

  const expectedSignature = parts.signature;
  if (!expectedSignature) return false;

  const hash = crypto
    .createHash('md5')
    .update(rawBody + PAYU_MD5_KEY)
    .digest('hex');

  return hash === expectedSignature;
}

// Pobranie dostępnych metod płatności
export interface PayUPayMethod {
  value: string;
  name: string;
  brandImageUrl: string;
  status: string;
  minAmount?: number;
  maxAmount?: number;
}

export interface PayUPayMethodCategory {
  key: string;
  label: string;
  icon: string;
  methods: PayUPayMethod[];
  expandable: boolean;
}

export async function getPaymentMethods(): Promise<PayUPayMethodCategory[]> {
  const token = await getAccessToken();

  const res = await fetch(`${PAYU_BASE_URL}/api/v2_1/paymethods`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!res.ok) {
    throw new Error(`PayU paymethods failed: ${res.status}`);
  }

  const data = await res.json();
  const methods: PayUPayMethod[] = (data.payByLinks || []).filter(
    (m: PayUPayMethod) => m.status === 'ENABLED'
  );

  // Kategoryzuj metody
  const categories: PayUPayMethodCategory[] = [];

  // Wartości specjalne (nie wchodzą do "Szybkich płatności")
  const specialValues = new Set(['blik', 'c', 'ap', 'jp', 'gp', 'dpp', 'ai', 'o']);

  // 1. BLIK
  const blik = methods.find(m => m.value === 'blik');
  if (blik) {
    categories.push({
      key: 'blik',
      label: 'BLIK',
      icon: blik.brandImageUrl,
      methods: [blik],
      expandable: false,
    });
  }

  // 2. Karta płatnicza (Visa/Mastercard)
  const card = methods.find(m => m.value === 'c');
  if (card) {
    categories.push({
      key: 'card',
      label: 'Karta płatnicza',
      icon: card.brandImageUrl,
      methods: [card],
      expandable: false,
    });
  }

  // 3. Portfele cyfrowe (Google Pay + Apple Pay)
  const wallets = methods.filter(m => m.value === 'ap' || m.value === 'jp' || m.value === 'gp');
  if (wallets.length > 0) {
    const walletNames = wallets.map(w => w.name).join(' / ');
    categories.push({
      key: 'wallet',
      label: walletNames || 'Portfel cyfrowy',
      icon: wallets[0].brandImageUrl,
      methods: wallets,
      expandable: wallets.length > 1,
    });
  }

  // 4. Szybkie płatności (banki online) — wszystko co nie jest w specialValues
  const banks = methods.filter(m => !specialValues.has(m.value));
  if (banks.length > 0) {
    categories.push({
      key: 'transfer',
      label: 'Szybkie płatności',
      icon: 'https://poland.payu.com/wp-content/uploads/sites/14/2020/05/PAYU_LOGO_LIME.png',
      methods: banks,
      expandable: true,
    });
  }

  // 5. PayPo / Raty (kup teraz, zapłać później)
  const bnpl = methods.filter(m => m.value === 'dpp' || m.value === 'ai');
  if (bnpl.length > 0) {
    categories.push({
      key: 'bnpl',
      label: bnpl[0].name || 'Zapłać później',
      icon: bnpl[0].brandImageUrl,
      methods: bnpl,
      expandable: false,
    });
  }

  return categories;
}

// Tworzenie zamówienia z wybraną metodą płatności
export interface PayUOrderWithMethodRequest extends PayUOrderRequest {
  payMethodType?: string; // PBL, CARD_TOKEN, etc.
  payMethodValue?: string; // blik, c, m, etc.
}

export async function createPayUOrderWithMethod(order: PayUOrderWithMethodRequest): Promise<PayUOrderResponse> {
  const token = await getAccessToken();

  const body: Record<string, unknown> = {
    notifyUrl: order.notifyUrl,
    continueUrl: order.continueUrl,
    customerIp: order.customerIp,
    merchantPosId: PAYU_POS_ID,
    description: order.description,
    currencyCode: 'PLN',
    totalAmount: order.totalAmount.toString(),
    extOrderId: order.extOrderId,
    buyer: {
      email: order.buyerEmail,
      ...(order.buyerPhone ? { phone: order.buyerPhone } : {}),
    },
    products: [
      {
        name: order.productName,
        unitPrice: order.totalAmount.toString(),
        quantity: '1',
      },
    ],
    settings: {
      invoiceDisabled: true,
    },
  };

  // Dodaj wybraną metodę płatności
  if (order.payMethodType && order.payMethodValue) {
    body.payMethods = {
      payMethod: {
        type: order.payMethodType,
        value: order.payMethodValue,
      },
    };
  }

  const res = await fetch(`${PAYU_BASE_URL}/api/v2_1/orders`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
    redirect: 'manual',
  });

  if (res.status === 302 || res.status === 301) {
    const redirectUri = res.headers.get('Location') || '';
    const responseBody = await res.json().catch(() => ({}));
    return {
      status: responseBody.status || { statusCode: 'SUCCESS' },
      redirectUri,
      orderId: responseBody.orderId || '',
      extOrderId: order.extOrderId,
    };
  }

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`PayU create order failed: ${res.status} ${text}`);
  }

  return await res.json();
}

export { PAYU_POS_ID, PAYU_BASE_URL };
