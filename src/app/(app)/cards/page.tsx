'use client';

import { useState, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useCards, RARITY_CONFIG } from '@/hooks/useCards';
import { useCardOrders } from '@/hooks/useCardOrders';
import { Card, Badge, ProgressBar, Button, Modal } from '@/components/ui';
import { CardRarity, CollectibleCard, CardOrder } from '@/types';
import {
  Layers,
  Star,
  Lock,
  Sparkles,
  X,
  Car,
  Award,
  Gauge,
  Zap,
  Timer,
  ShoppingCart,
  Heart,
  Clock,
  CheckCircle,
  Copy,
  CreditCard,
  Crown,
  User,
  Package,
  ChevronRight,
} from 'lucide-react';
import Link from 'next/link';
import { CollectibleCardDisplay } from '@/components/cards';

type ViewTab = 'car' | 'achievement';

// Demo karty Heroes
const DEMO_HERO_CARDS: CollectibleCard[] = [
  {
    id: 'demo-hero-1',
    name: 'Jan Kowalski',
    description: 'Ambasador Turbo Pomoc od 2020 roku. Właściciel legendarnego 911 GT3.',
    rarity: 'legendary',
    card_type: 'car',
    category: 'Turbo Heroes',
    points: 200,
    is_hero: true,
    hero_name: 'Jan Kowalski',
    hero_title: 'Ambasador Turbo Pomoc',
    car_brand: 'Porsche',
    car_model: '911 GT3',
    car_horsepower: 510,
    car_torque: 470,
    car_max_speed: 318,
    car_year: 2022,
    is_active: true,
    created_at: new Date().toISOString(),
  },
];

// Demo karty samochodów
const DEMO_CAR_CARDS: CollectibleCard[] = [
  {
    id: 'demo-c1',
    name: 'Porsche 911 Turbo S',
    description: 'Ikona sportowych samochodów',
    rarity: 'legendary',
    card_type: 'car',
    category: 'Porsche',
    points: 100,
    car_brand: 'Porsche',
    car_model: '911 Turbo S',
    car_horsepower: 650,
    car_torque: 800,
    car_max_speed: 330,
    car_year: 2024,
    price: 10,
    xp_reward: 10,
    is_purchasable: true,
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 'demo-c2',
    name: 'BMW M3 Competition',
    description: 'Sportowy sedan o legendarnych osiągach',
    rarity: 'epic',
    card_type: 'car',
    category: 'BMW',
    points: 75,
    car_brand: 'BMW',
    car_model: 'M3 Competition',
    car_horsepower: 510,
    car_torque: 650,
    car_max_speed: 290,
    car_year: 2024,
    price: 5,
    xp_reward: 5,
    is_purchasable: true,
    is_active: true,
    created_at: new Date().toISOString(),
  },
];

// Demo karty osiągnięć
const DEMO_ACHIEVEMENT_CARDS: CollectibleCard[] = [
  {
    id: 'demo-a1',
    name: 'Turbo Starter',
    description: 'Pierwsza karta każdego gracza. Początek wielkiej przygody!',
    rarity: 'common',
    card_type: 'achievement',
    category: 'Podstawowe',
    points: 10,
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 'demo-a2',
    name: 'Speed Demon',
    description: 'Karta za ukończenie 5 misji.',
    rarity: 'rare',
    card_type: 'achievement',
    category: 'Osiągnięcia',
    points: 25,
    is_active: true,
    created_at: new Date().toISOString(),
  },
];

interface BrandGroup {
  brand: string;
  cards: CollectibleCard[];
  collected: number;
}

export default function CardsPage() {
  const { profile } = useAuth();
  const { allCards, loading, hasCard, getUserCardCount, getCollectionStats, getCardsByType } = useCards({
    userId: profile?.id,
  });
  const { createOrder, getUserOrderForCard } = useCardOrders({
    userId: profile?.id,
  });

  const [activeTab, setActiveTab] = useState<ViewTab>('car');
  const [selectedCard, setSelectedCard] = useState<CollectibleCard | null>(null);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [purchaseCard, setPurchaseCard] = useState<CollectibleCard | null>(null);
  const [createdOrder, setCreatedOrder] = useState<CardOrder | null>(null);
  const [purchasing, setPurchasing] = useState(false);
  const [copied, setCopied] = useState(false);

  // Pobierz karty według typu
  const achievementCards = getCardsByType('achievement');
  const carCards = getCardsByType('car');

  // Użyj demo kart jeśli brak kart w bazie
  const allCarCards = carCards.length > 0 ? carCards : [...DEMO_HERO_CARDS, ...DEMO_CAR_CARDS];
  const displayAchievementCards = achievementCards.length > 0 ? achievementCards : DEMO_ACHIEVEMENT_CARDS;
  const isDemoMode = allCards.length === 0;

  // Rozdziel Heroes i zwykłe samochody
  const heroCards = allCarCards.filter(c => c.is_hero);
  const regularCarCards = allCarCards.filter(c => !c.is_hero);

  // Grupuj samochody po markach
  const brandGroups = useMemo(() => {
    const brands = new Map<string, BrandGroup>();

    regularCarCards.forEach(card => {
      const brand = card.car_brand || card.category || 'Inne';
      if (!brands.has(brand)) {
        brands.set(brand, { brand, cards: [], collected: 0 });
      }
      const group = brands.get(brand)!;
      group.cards.push(card);
      if (!isDemoMode && hasCard(card.id)) {
        group.collected++;
      }
    });

    return Array.from(brands.values()).sort((a, b) => b.cards.length - a.cards.length);
  }, [regularCarCards, isDemoMode, hasCard]);

  // Statystyki
  const heroStats = useMemo(() => {
    const collected = isDemoMode ? 0 : heroCards.filter(c => hasCard(c.id)).length;
    return { total: heroCards.length, collected };
  }, [heroCards, isDemoMode, hasCard]);

  const carStats = useMemo(() => {
    const total = regularCarCards.length;
    const collected = isDemoMode ? 0 : regularCarCards.filter(c => hasCard(c.id)).length;
    return { total, collected };
  }, [regularCarCards, isDemoMode, hasCard]);

  // Rozpocznij proces zakupu
  const handleBuyClick = (card: CollectibleCard) => {
    if (isDemoMode) return;
    setPurchaseCard(card);
    setCreatedOrder(null);
    setShowPurchaseModal(true);
  };

  // Utwórz zamówienie
  const handleCreateOrder = async () => {
    if (!purchaseCard || !purchaseCard.price) return;

    setPurchasing(true);
    const { order, error } = await createOrder(
      purchaseCard.id,
      purchaseCard.price,
      purchaseCard.xp_reward || 1
    );
    setPurchasing(false);

    if (error) {
      alert(error);
      return;
    }

    if (order) {
      setCreatedOrder(order);
    }
  };

  // Kopiuj kod do schowka
  const copyOrderCode = () => {
    if (createdOrder?.order_code) {
      navigator.clipboard.writeText(createdOrder.order_code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // === RENDER: Karta Hero (pełna szerokość, 16:9) ===
  const renderHeroCard = (card: CollectibleCard) => {
    const owned = !isDemoMode && hasCard(card.id);

    return (
      <CollectibleCardDisplay
        key={card.id}
        card={card}
        owned={owned}
        variant="hero"
        onClick={() => setSelectedCard(card)}
        isDemoMode={isDemoMode}
      />
    );
  };

  // === RENDER: Karta samochodu (miniaturka w siatce) ===
  const renderCarCard = (card: CollectibleCard) => {
    const owned = !isDemoMode && hasCard(card.id);
    const pendingOrder = !isDemoMode ? getUserOrderForCard(card.id) : undefined;
    const count = !isDemoMode ? getUserCardCount(card.id) : 0;

    return (
      <CollectibleCardDisplay
        key={card.id}
        card={card}
        owned={owned}
        pendingOrder={pendingOrder?.status === 'pending'}
        count={count}
        variant="grid"
        onClick={() => setSelectedCard(card)}
        isDemoMode={isDemoMode}
      />
    );
  };

  // === RENDER: Karta osiągnięcia ===
  const renderAchievementCard = (card: CollectibleCard) => {
    const owned = !isDemoMode && hasCard(card.id);
    const count = !isDemoMode ? getUserCardCount(card.id) : 0;
    const config = RARITY_CONFIG[card.rarity];

    return (
      <button
        key={card.id}
        onClick={() => setSelectedCard(card)}
        className={`relative group text-left transition-all duration-300 ${
          owned ? 'hover:scale-105' : 'opacity-60 hover:opacity-80'
        }`}
      >
        <div className={`relative rounded-xl border-2 overflow-hidden ${config.borderColor} ${
          owned && card.rarity !== 'common' ? `shadow-lg ${config.glowColor}` : ''
        }`}>
          <div className={`aspect-[3/4] ${config.bgColor} flex items-center justify-center relative`}>
            {card.image_url ? (
              <img src={card.image_url} alt={card.name} className={`w-full h-full object-cover ${!owned ? 'grayscale' : ''}`} />
            ) : (
              <div className="text-center p-4">
                <div className="text-4xl mb-2">{config.icon}</div>
                <Sparkles className={`w-8 h-8 mx-auto ${config.color}`} />
              </div>
            )}

            {!owned && !isDemoMode && (
              <div className="absolute inset-0 bg-dark-900/60 flex items-center justify-center">
                <Lock className="w-8 h-8 text-dark-400" />
              </div>
            )}

            <div className={`absolute top-2 right-2 px-2 py-0.5 rounded-full text-xs font-bold ${config.bgColor} ${config.color}`}>
              {config.name}
            </div>

            {count > 1 && (
              <div className="absolute top-2 left-2 w-6 h-6 rounded-full bg-turbo-500 text-white text-xs font-bold flex items-center justify-center">
                x{count}
              </div>
            )}
          </div>

          <div className="p-3 bg-dark-800">
            <h3 className={`font-semibold text-sm truncate ${owned ? 'text-white' : 'text-dark-400'}`}>
              {card.name}
            </h3>
            <div className="flex items-center justify-between mt-1">
              <span className="text-xs text-dark-500">{card.category}</span>
              <span className={`text-xs font-medium ${config.color}`}>+{card.points} pkt</span>
            </div>
          </div>
        </div>
      </button>
    );
  };

  const stats = getCollectionStats(activeTab);

  return (
    <div className="py-4 pb-24">
      {/* Header */}
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-purple-500/20 mb-3">
          <Layers className="w-8 h-8 text-purple-500" />
        </div>
        <h1 className="text-2xl font-bold text-white">Kolekcja Kart</h1>
        <p className="text-dark-400 mt-1">Zbieraj karty i wspieraj Turbo Pomoc!</p>
      </div>

      {/* Info o charytatywnym celu */}
      <Card className="mb-4 border-red-500/30 bg-red-500/10">
        <div className="flex items-start gap-3">
          <Heart className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-red-400 font-medium">Kupując karty wspierasz Turbo Pomoc</p>
            <p className="text-sm text-red-400/70">
              100% wpłat trafia na cel charytatywny. Za każdą kartę otrzymujesz punkty do rankingu!
            </p>
          </div>
        </div>
      </Card>

      {/* Mystery Garage Link */}
      <Link href="/mystery">
        <Card className="mb-6 border-emerald-500/50 hover:border-emerald-400 transition-colors">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
              <Package className="w-6 h-6 text-emerald-400" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-white">Mystery Garage</h3>
              <p className="text-sm text-dark-400">
                Kup pakiet losowych kart • od 15 zł • 3-10 kart
              </p>
            </div>
            <ChevronRight className="w-5 h-5 text-emerald-400 flex-shrink-0" />
          </div>
        </Card>
      </Link>

      {/* Demo mode notice */}
      {isDemoMode && (
        <Card className="mb-4 border-yellow-500/30 bg-yellow-500/10">
          <div className="flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-yellow-500 mt-0.5" />
            <div>
              <p className="text-yellow-400 font-medium">Tryb podglądu</p>
              <p className="text-sm text-yellow-400/70">
                To przykładowe karty. Administrator może dodać karty w panelu admina.
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab('car')}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium transition-colors ${
            activeTab === 'car'
              ? 'bg-turbo-500 text-white'
              : 'bg-dark-700 text-dark-300 hover:bg-dark-600'
          }`}
        >
          <Car className="w-5 h-5" />
          Samochody
        </button>
        <button
          onClick={() => setActiveTab('achievement')}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium transition-colors ${
            activeTab === 'achievement'
              ? 'bg-purple-500 text-white'
              : 'bg-dark-700 text-dark-300 hover:bg-dark-600'
          }`}
        >
          <Award className="w-5 h-5" />
          Osiągnięcia
        </button>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-32 bg-dark-700 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : activeTab === 'car' ? (
        <div className="space-y-8">
          {/* === TURBO HEROES === */}
          {heroCards.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Crown className="w-6 h-6 text-yellow-500" />
                  <h2 className="text-xl font-bold text-white">Turbo Heroes</h2>
                </div>
                <span className="text-sm text-dark-400 bg-dark-700 px-3 py-1 rounded-full">
                  {heroStats.collected}/{heroStats.total}
                </span>
              </div>
              <p className="text-sm text-dark-400 mb-4">
                Legendarne karty kierowców z eventów Turbo Pomoc
              </p>
              <div className="space-y-4">
                {heroCards.map(renderHeroCard)}
              </div>
            </div>
          )}

          {/* === TURBO CARS === */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Car className="w-6 h-6 text-turbo-400" />
                <h2 className="text-xl font-bold text-white">Turbo Cars</h2>
              </div>
              <span className="text-sm text-dark-400 bg-dark-700 px-3 py-1 rounded-full">
                {carStats.collected}/{carStats.total}
              </span>
            </div>

            {/* Progress bar */}
            <Card className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-dark-400">Postęp kolekcji</span>
                <span className="text-turbo-400 font-bold">
                  {carStats.total > 0 ? Math.round((carStats.collected / carStats.total) * 100) : 0}%
                </span>
              </div>
              <ProgressBar
                value={carStats.total > 0 ? Math.round((carStats.collected / carStats.total) * 100) : 0}
              />
            </Card>

            {/* Karty pogrupowane po markach */}
            {brandGroups.map(group => (
              <div key={group.brand} className="mb-6">
                {/* Nagłówek marki */}
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold text-white">{group.brand}</h3>
                  <span className="text-xs text-dark-500">
                    {group.collected}/{group.cards.length}
                  </span>
                </div>

                {/* Siatka kart */}
                <div className="grid grid-cols-2 gap-3">
                  {group.cards.map(renderCarCard)}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* === OSIĄGNIĘCIA === */
        <div className="space-y-6">
          <Card className="mb-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Star className="w-5 h-5 text-yellow-500" />
                <span className="font-semibold text-white">Karty osiągnięć</span>
              </div>
              <span className="text-turbo-400 font-bold">
                {stats.collected}/{stats.total}
              </span>
            </div>
            <ProgressBar value={stats.total > 0 ? Math.round((stats.collected / stats.total) * 100) : 0} />

            <div className="grid grid-cols-4 gap-2 mt-4">
              {(Object.keys(RARITY_CONFIG) as CardRarity[]).map(rarity => {
                const config = RARITY_CONFIG[rarity];
                const rarityStats = stats.byRarity[rarity];
                return (
                  <div key={rarity} className={`text-center p-2 rounded-lg ${config.bgColor}`}>
                    <div className="text-lg">{config.icon}</div>
                    <div className={`text-xs font-medium ${config.color}`}>
                      {rarityStats.collected}/{rarityStats.total}
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Karty osiągnięć grupowane po kategorii */}
          {Array.from(new Set(displayAchievementCards.map(c => c.category))).map(category => {
            const categoryCards = displayAchievementCards.filter(c => c.category === category);
            return (
              <div key={category}>
                <h2 className="text-sm font-semibold text-dark-400 uppercase tracking-wider mb-3">
                  {category}
                </h2>
                <div className="grid grid-cols-2 gap-3">
                  {categoryCards.map(renderAchievementCard)}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* === MODAL: Szczegóły karty === */}
      {selectedCard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80" onClick={() => setSelectedCard(null)}>
          <div className="relative w-full max-w-md max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <button
              onClick={() => setSelectedCard(null)}
              className="absolute -top-10 right-0 text-white/60 hover:text-white z-10"
            >
              <X className="w-6 h-6" />
            </button>

            {(() => {
              const config = RARITY_CONFIG[selectedCard.rarity];
              const owned = !isDemoMode && hasCard(selectedCard.id);
              const count = !isDemoMode ? getUserCardCount(selectedCard.id) : 0;

              if (selectedCard.card_type === 'car') {
                return (
                  <div className={`rounded-2xl border-2 overflow-hidden ${config.borderColor} ${
                    owned ? `shadow-2xl ${config.glowColor}` : ''
                  }`}>
                    {/* Hero badge */}
                    {selectedCard.is_hero && (
                      <div className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 px-4 py-2 flex items-center gap-2">
                        <Crown className="w-5 h-5 text-yellow-500" />
                        <span className="font-bold text-yellow-400">TURBO HERO</span>
                      </div>
                    )}

                    <div className={`aspect-video ${config.bgColor} flex items-center justify-center relative`}>
                      {selectedCard.image_url ? (
                        <img src={selectedCard.image_url} alt={selectedCard.name} className="w-full h-full object-cover" />
                      ) : selectedCard.is_hero ? (
                        <div className="text-center">
                          <User className={`w-16 h-16 ${config.color} mx-auto`} />
                          <Car className={`w-10 h-10 ${config.color} mx-auto mt-2`} />
                        </div>
                      ) : (
                        <Car className={`w-24 h-24 ${config.color}`} />
                      )}

                      <div className={`absolute top-4 right-4 px-3 py-1 rounded-full font-bold ${config.bgColor} ${config.color}`}>
                        {config.name}
                      </div>

                      {count > 1 && (
                        <div className="absolute top-4 left-4 w-8 h-8 rounded-full bg-turbo-500 text-white font-bold flex items-center justify-center">
                          x{count}
                        </div>
                      )}
                    </div>

                    <div className="p-4 bg-dark-800">
                      {selectedCard.is_hero && (
                        <>
                          <p className="text-sm text-yellow-500 font-medium">{selectedCard.hero_title}</p>
                          <h2 className="text-2xl font-bold text-white mb-1">{selectedCard.hero_name}</h2>
                        </>
                      )}

                      <p className={`text-sm ${config.color} font-medium`}>{selectedCard.car_brand}</p>
                      <h2 className={`text-xl font-bold text-white mb-1 ${selectedCard.is_hero ? '' : 'text-2xl'}`}>
                        {selectedCard.car_model}
                      </h2>
                      {selectedCard.car_year && (
                        <p className="text-dark-500 text-sm mb-4">Rok: {selectedCard.car_year}</p>
                      )}

                      <div className="grid grid-cols-3 gap-4 py-4 border-t border-b border-dark-700">
                        <div className="text-center">
                          <Zap className="w-6 h-6 text-yellow-500 mx-auto mb-1" />
                          <div className="text-2xl font-bold text-white">{selectedCard.car_horsepower || '?'}</div>
                          <p className="text-xs text-dark-500">Moc (KM)</p>
                        </div>
                        <div className="text-center">
                          <Gauge className="w-6 h-6 text-blue-500 mx-auto mb-1" />
                          <div className="text-2xl font-bold text-white">{selectedCard.car_torque || '?'}</div>
                          <p className="text-xs text-dark-500">Moment (Nm)</p>
                        </div>
                        <div className="text-center">
                          <Timer className="w-6 h-6 text-red-500 mx-auto mb-1" />
                          <div className="text-2xl font-bold text-white">{selectedCard.car_max_speed || '?'}</div>
                          <p className="text-xs text-dark-500">V-max (km/h)</p>
                        </div>
                      </div>

                      {selectedCard.description && (
                        <p className="text-dark-400 text-sm mt-4">{selectedCard.description}</p>
                      )}

                      <div className="flex items-center justify-between mt-4">
                        <span className="text-dark-500">{selectedCard.category}</span>
                        <span className={`font-bold ${config.color}`}>+{selectedCard.points} pkt</span>
                      </div>

                      {selectedCard.is_purchasable && selectedCard.price && !owned && !isDemoMode && (
                        <Button
                          onClick={() => {
                            setSelectedCard(null);
                            handleBuyClick(selectedCard);
                          }}
                          className="w-full mt-4"
                        >
                          <Heart className="w-4 h-4 mr-2" />
                          Wesprzyj {selectedCard.price} zł i zdobądź kartę
                        </Button>
                      )}
                    </div>
                  </div>
                );
              }

              // Karta osiągnięcia
              return (
                <div className={`rounded-2xl border-2 overflow-hidden ${config.borderColor} ${
                  owned && selectedCard.rarity !== 'common' ? `shadow-2xl ${config.glowColor}` : ''
                }`}>
                  <div className={`aspect-[3/4] ${config.bgColor} flex items-center justify-center relative`}>
                    {selectedCard.image_url ? (
                      <img src={selectedCard.image_url} alt={selectedCard.name} className={`w-full h-full object-cover ${!owned ? 'grayscale' : ''}`} />
                    ) : (
                      <div className="text-center">
                        <div className="text-8xl mb-4">{config.icon}</div>
                        <Sparkles className={`w-16 h-16 mx-auto ${config.color}`} />
                      </div>
                    )}

                    {!owned && !isDemoMode && (
                      <div className="absolute inset-0 bg-dark-900/60 flex items-center justify-center">
                        <div className="text-center">
                          <Lock className="w-12 h-12 text-dark-400 mx-auto mb-2" />
                          <p className="text-dark-400">Nie posiadasz tej karty</p>
                        </div>
                      </div>
                    )}

                    <div className={`absolute top-4 right-4 px-3 py-1 rounded-full font-bold ${config.bgColor} ${config.color}`}>
                      {config.name}
                    </div>

                    {count > 1 && (
                      <div className="absolute top-4 left-4 w-8 h-8 rounded-full bg-turbo-500 text-white font-bold flex items-center justify-center">
                        x{count}
                      </div>
                    )}
                  </div>

                  <div className="p-4 bg-dark-800">
                    <h2 className="text-xl font-bold text-white mb-1">{selectedCard.name}</h2>
                    <p className="text-dark-400 text-sm mb-3">{selectedCard.description}</p>

                    <div className="flex items-center justify-between">
                      <span className="text-dark-500">{selectedCard.category}</span>
                      <span className={`font-bold ${config.color}`}>+{selectedCard.points} pkt</span>
                    </div>

                    {selectedCard.total_supply && (
                      <div className="mt-3 pt-3 border-t border-dark-700">
                        <p className="text-xs text-dark-500 text-center">
                          Limitowana edycja: {selectedCard.total_supply} sztuk
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* === MODAL: Zakup === */}
      <Modal
        isOpen={showPurchaseModal}
        onClose={() => {
          setShowPurchaseModal(false);
          setPurchaseCard(null);
          setCreatedOrder(null);
        }}
        title={createdOrder ? 'Instrukcja płatności' : 'Wesprzyj Turbo Pomoc'}
        size="md"
      >
        {purchaseCard && (
          <div className="space-y-4">
            {!createdOrder ? (
              <>
                <div className="flex items-center gap-4 p-4 bg-dark-700 rounded-xl">
                  <div className="w-20 h-14 bg-dark-600 rounded-lg overflow-hidden flex items-center justify-center">
                    {purchaseCard.image_url ? (
                      <img src={purchaseCard.image_url} alt={purchaseCard.name} className="w-full h-full object-cover" />
                    ) : (
                      <Car className="w-8 h-8 text-dark-400" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-white">{purchaseCard.name}</p>
                    <p className="text-sm text-dark-400">{purchaseCard.car_brand} {purchaseCard.car_model}</p>
                  </div>
                </div>

                <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Heart className="w-5 h-5 text-red-500" />
                    <span className="font-medium text-red-400">Wpłata charytatywna</span>
                  </div>
                  <p className="text-sm text-red-400/80">
                    Cała kwota {purchaseCard.price} zł zostanie przekazana na Turbo Pomoc.
                    W zamian otrzymasz tę kartę!
                  </p>
                </div>

                <div className="border-t border-dark-700 pt-4">
                  <div className="flex justify-between mb-2">
                    <span className="text-dark-400">Wpłata:</span>
                    <span className="font-bold text-white">{purchaseCard.price} zł</span>
                  </div>
                </div>

                <Button onClick={handleCreateOrder} loading={purchasing} className="w-full">
                  <CreditCard className="w-4 h-4 mr-2" />
                  Przejdź do płatności
                </Button>
              </>
            ) : (
              <>
                <div className="text-center py-4">
                  <div className="w-16 h-16 rounded-full bg-turbo-500/20 flex items-center justify-center mx-auto mb-4">
                    <ShoppingCart className="w-8 h-8 text-turbo-500" />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">Zamówienie utworzone!</h3>
                  <p className="text-dark-400 text-sm">
                    Wykonaj przelew na poniższe dane. Po zaksięgowaniu wpłaty karta pojawi się na Twoim koncie.
                  </p>
                </div>

                <div className="bg-dark-700 rounded-xl p-4 space-y-3">
                  <div>
                    <p className="text-xs text-dark-400 mb-1">Numer konta</p>
                    <p className="font-mono text-white">XX XXXX XXXX XXXX XXXX XXXX XXXX</p>
                    <p className="text-xs text-dark-500 mt-1">Fundacja Turbo Pomoc</p>
                  </div>

                  <div>
                    <p className="text-xs text-dark-400 mb-1">Kwota</p>
                    <p className="font-bold text-white text-xl">{createdOrder.amount} zł</p>
                  </div>

                  <div>
                    <p className="text-xs text-dark-400 mb-1">Tytuł przelewu (ważne!)</p>
                    <div className="flex items-center gap-2">
                      <p className="font-mono font-bold text-turbo-400 text-lg flex-1">{createdOrder.order_code}</p>
                      <button onClick={copyOrderCode} className="p-2 hover:bg-dark-600 rounded-lg transition-colors">
                        {copied ? <CheckCircle className="w-5 h-5 text-green-500" /> : <Copy className="w-5 h-5 text-dark-400" />}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4">
                  <div className="flex items-start gap-2">
                    <Clock className="w-5 h-5 text-yellow-500 mt-0.5" />
                    <div>
                      <p className="font-medium text-yellow-400">Oczekiwanie na płatność</p>
                      <p className="text-sm text-yellow-400/80">
                        Po zaksięgowaniu wpłaty administrator zatwierdzi zamówienie i karta pojawi się w Twojej kolekcji.
                      </p>
                    </div>
                  </div>
                </div>

                <Button
                  variant="secondary"
                  onClick={() => {
                    setShowPurchaseModal(false);
                    setPurchaseCard(null);
                    setCreatedOrder(null);
                  }}
                  className="w-full"
                >
                  Zamknij
                </Button>
              </>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
