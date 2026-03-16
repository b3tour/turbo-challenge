'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui';
import {
  CreditCard,
  Smartphone,
  Building2,
  Wallet,
  Clock,
  ChevronDown,
  Loader2,
  Heart,
  ShieldCheck,
} from 'lucide-react';

interface PayMethod {
  value: string;
  name: string;
  brandImageUrl: string;
}

interface PayMethodCategory {
  key: string;
  label: string;
  icon: string;
  methods: PayMethod[];
  expandable: boolean;
}

interface PaymentGatewayProps {
  amount: number;        // PLN
  description: string;
  orderCode: string;
  orderType: 'card_order' | 'mystery_pack';
  buyerEmail: string;
  onSuccess?: () => void;
  onError?: (error: string) => void;
  onFallback?: () => void; // gdy PayU nie działa, pokaż stary flow
}

const categoryIcons: Record<string, React.ElementType> = {
  blik: Smartphone,
  card: CreditCard,
  wallet: Wallet,
  transfer: Building2,
  bnpl: Clock,
};

export default function PaymentGateway({
  amount,
  description,
  orderCode,
  orderType,
  buyerEmail,
  onError,
  onFallback,
}: PaymentGatewayProps) {
  const [categories, setCategories] = useState<PayMethodCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedBank, setSelectedBank] = useState<string | null>(null);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [paying, setPaying] = useState(false);

  // Pobierz metody płatności
  useEffect(() => {
    const fetchMethods = async () => {
      try {
        const res = await fetch('/api/payu/methods');
        const data = await res.json();

        if (data.categories && data.categories.length > 0) {
          setCategories(data.categories);
          setSelectedCategory(data.categories[0].key);
        } else {
          // Brak metod — fallback
          onFallback?.();
        }
      } catch {
        onFallback?.();
      } finally {
        setLoading(false);
      }
    };

    fetchMethods();
  }, [onFallback]);

  const getSelectedPayMethod = useCallback((): { type: string; value: string } | null => {
    if (!selectedCategory) return null;

    const cat = categories.find(c => c.key === selectedCategory);
    if (!cat) return null;

    // Expandable (banki, portfele z wieloma opcjami) — wymaga wyboru
    if (cat.expandable) {
      return selectedBank ? { type: 'PBL', value: selectedBank } : null;
    }

    // Jedna metoda — użyj jej
    if (cat.methods.length === 1) {
      return { type: 'PBL', value: cat.methods[0].value };
    }

    return null;
  }, [selectedCategory, selectedBank, categories]);

  const handlePay = async () => {
    const payMethod = getSelectedPayMethod();

    if (!payMethod && selectedCategory === 'transfer' && !selectedBank) {
      onError?.('Wybierz bank');
      return;
    }

    setPaying(true);

    try {
      const res = await fetch('/api/payu/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderCode,
          amount,
          description,
          buyerEmail,
          orderType,
          payMethodType: payMethod?.type,
          payMethodValue: payMethod?.value,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setPaying(false);
        onError?.(data.error || 'Błąd płatności');
        return;
      }

      if (data.redirectUri) {
        window.location.href = data.redirectUri;
      } else {
        setPaying(false);
        onError?.('Brak linku do płatności');
      }
    } catch {
      setPaying(false);
      onError?.('Błąd połączenia z systemem płatności');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 text-turbo-500 animate-spin" />
        <span className="ml-2 text-dark-400 text-sm">Ładowanie metod płatności...</span>
      </div>
    );
  }

  if (categories.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      {/* Info o darowizna */}
      <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-xl">
        <Heart className="w-5 h-5 text-red-500 flex-shrink-0" />
        <p className="text-sm text-red-400">
          Cała kwota <span className="font-bold text-white">{amount} zł</span> trafia na Turbo Pomoc
        </p>
      </div>

      {/* Wybór metody płatności */}
      <div className="space-y-2">
        <p className="text-sm font-medium text-dark-300">Wybierz sposób płatności</p>

        {categories.map((cat) => {
          const Icon = categoryIcons[cat.key] || CreditCard;
          const isSelected = selectedCategory === cat.key;
          const isExpanded = expandedCategory === cat.key;

          return (
            <div key={cat.key}>
              {/* Główny kafelek kategorii */}
              <button
                type="button"
                onClick={() => {
                  setSelectedCategory(cat.key);
                  if (cat.expandable) {
                    setExpandedCategory(isExpanded ? null : cat.key);
                  } else {
                    setExpandedCategory(null);
                    setSelectedBank(null);
                  }
                }}
                className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all ${
                  isSelected
                    ? 'border-turbo-500 bg-turbo-500/10'
                    : 'border-dark-600 bg-dark-800 hover:border-dark-500'
                }`}
              >
                {/* Radio dot */}
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                  isSelected ? 'border-turbo-500' : 'border-dark-500'
                }`}>
                  {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-turbo-500" />}
                </div>

                {/* Ikony — portfele pokazują wszystkie metody obok siebie */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  {(cat.key === 'wallet' && cat.methods.length > 1)
                    ? cat.methods.map(m => (
                        <img
                          key={m.value}
                          src={m.brandImageUrl}
                          alt={m.name}
                          className="h-7 w-auto"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                        />
                      ))
                    : cat.icon ? (
                        <img
                          src={cat.icon}
                          alt={cat.label}
                          className="h-7 w-auto"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                        />
                      ) : (
                        <Icon className="w-6 h-6 text-dark-300" />
                      )
                  }
                </div>

                {/* Label */}
                <span className={`text-sm font-medium flex-1 text-left ${
                  isSelected ? 'text-white' : 'text-dark-300'
                }`}>
                  {cat.label}
                </span>

                {/* Expand arrow */}
                {cat.expandable && (
                  <ChevronDown className={`w-4 h-4 text-dark-400 transition-transform ${
                    isExpanded ? 'rotate-180' : ''
                  }`} />
                )}
              </button>

              {/* Grid banków (rozwijany) */}
              {cat.expandable && isSelected && isExpanded && (
                <div className="mt-2 p-3 bg-dark-800 rounded-xl border border-dark-700">
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {cat.methods.map((method) => (
                      <button
                        key={method.value}
                        type="button"
                        onClick={() => setSelectedBank(method.value)}
                        className={`flex flex-col items-center gap-1 p-2 rounded-lg border transition-all ${
                          selectedBank === method.value
                            ? 'border-turbo-500 bg-turbo-500/10'
                            : 'border-dark-600 bg-dark-700/50 hover:border-dark-500'
                        }`}
                      >
                        {method.brandImageUrl && (
                          <img
                            src={method.brandImageUrl}
                            alt={method.name}
                            className="h-6 w-auto object-contain"
                          />
                        )}
                        <span className="text-[10px] text-dark-400 truncate w-full text-center">
                          {method.name}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Przycisk zapłać */}
      <Button
        onClick={handlePay}
        loading={paying}
        fullWidth
        size="lg"
        disabled={!selectedCategory || !getSelectedPayMethod()}
      >
        <ShieldCheck className="w-5 h-5 mr-2" />
        Zapłać {amount} zł
      </Button>

      {/* Bezpieczeństwo */}
      <p className="text-xs text-dark-500 text-center">
        Płatność obsługiwana przez PayU. Twoje dane są bezpieczne.
      </p>
    </div>
  );
}
