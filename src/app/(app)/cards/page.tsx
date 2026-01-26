'use client';

import { useState, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useCards, RARITY_CONFIG } from '@/hooks/useCards';
import { useCardOrders } from '@/hooks/useCardOrders';
import { Card, Badge, ProgressBar, Button, Modal } from '@/components/ui';
import { CardRarity, CollectibleCard, CardOrder, CardImage } from '@/types';
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
  Download,
  ChevronLeft,
  Image as ImageIcon,
  Info,
  Fuel,
  Weight,
  Activity,
  Cog,
  Swords,
  Grid2X2,
  Grid3X3,
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
  const { allCards, userCards, loading, hasCard, getUserCardCount, getCollectionStats, getCardsByType, fetchCardImages } = useCards({
    userId: profile?.id,
  });
  const { createOrder, getUserOrderForCard } = useCardOrders({
    userId: profile?.id,
  });

  const [activeTab, setActiveTab] = useState<ViewTab>('car');
  const [collectionFilter, setCollectionFilter] = useState<'all' | 'owned' | 'to_collect'>('all');
  const [gridColumns, setGridColumns] = useState<2 | 3>(2);
  const [selectedCard, setSelectedCard] = useState<CollectibleCard | null>(null);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [purchaseCard, setPurchaseCard] = useState<CollectibleCard | null>(null);
  const [createdOrder, setCreatedOrder] = useState<CardOrder | null>(null);
  const [purchasing, setPurchasing] = useState(false);
  const [copied, setCopied] = useState(false);

  // Gallery state
  const [cardImages, setCardImages] = useState<CardImage[]>([]);
  const [loadingImages, setLoadingImages] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showGallery, setShowGallery] = useState(false);

  // Pobierz karty według typu
  const achievementCards = getCardsByType('achievement');
  const carCards = getCardsByType('car');

  // Użyj demo kart jeśli brak kart w bazie
  const allCarCards = carCards.length > 0 ? carCards : [...DEMO_HERO_CARDS, ...DEMO_CAR_CARDS];
  const displayAchievementCards = achievementCards.length > 0 ? achievementCards : DEMO_ACHIEVEMENT_CARDS;
  const isDemoMode = allCards.length === 0;

  // Rozdziel Heroes i zwykłe samochody
  const heroCardsRaw = allCarCards.filter(c => c.is_hero);
  const regularCarCards = allCarCards.filter(c => !c.is_hero);

  // Sortuj Heroes - posiadane pierwsze
  const heroCards = useMemo(() => {
    return [...heroCardsRaw].sort((a, b) => {
      const aOwned = !isDemoMode && hasCard(a.id) ? 0 : 1;
      const bOwned = !isDemoMode && hasCard(b.id) ? 0 : 1;
      return aOwned - bOwned;
    });
  }, [heroCardsRaw, isDemoMode, hasCard, userCards]);

  // Grupuj samochody po markach (z sortowaniem - posiadane pierwsze)
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

    // Sortuj karty w każdej grupie - posiadane pierwsze
    brands.forEach(group => {
      group.cards.sort((a, b) => {
        const aOwned = !isDemoMode && hasCard(a.id) ? 0 : 1;
        const bOwned = !isDemoMode && hasCard(b.id) ? 0 : 1;
        return aOwned - bOwned;
      });
    });

    // Sortuj marki - najpierw te z posiadanymi kartami, potem reszta
    return Array.from(brands.values()).sort((a, b) => {
      // Najpierw marki z posiadanymi kartami
      if (a.collected > 0 && b.collected === 0) return -1;
      if (a.collected === 0 && b.collected > 0) return 1;
      // Wśród marek z kartami - sortuj po ilości posiadanych
      if (a.collected > 0 && b.collected > 0) {
        return b.collected - a.collected;
      }
      // Wśród marek bez kart - sortuj po ilości wszystkich kart
      return b.cards.length - a.cards.length;
    });
  }, [regularCarCards, isDemoMode, hasCard, userCards]);

  // Statystyki
  const heroStats = useMemo(() => {
    const collected = isDemoMode ? 0 : heroCards.filter(c => hasCard(c.id)).length;
    return { total: heroCards.length, collected };
  }, [heroCards, isDemoMode, hasCard, userCards]);

  const carStats = useMemo(() => {
    const total = regularCarCards.length;
    const collected = isDemoMode ? 0 : regularCarCards.filter(c => hasCard(c.id)).length;
    return { total, collected };
  }, [regularCarCards, isDemoMode, hasCard, userCards]);

  // Statystyki wszystkich samochodów (heroes + regular) z podziałem na rzadkości
  const allCarStats = useMemo(() => {
    const allCars = [...heroCards, ...regularCarCards];
    const total = allCars.length;
    const collected = isDemoMode ? 0 : allCars.filter(c => hasCard(c.id)).length;

    const byRarity = {
      common: { total: 0, collected: 0 },
      rare: { total: 0, collected: 0 },
      epic: { total: 0, collected: 0 },
      legendary: { total: 0, collected: 0 },
    };

    allCars.forEach(card => {
      const rarity = card.rarity as CardRarity;
      if (byRarity[rarity]) {
        byRarity[rarity].total++;
        if (!isDemoMode && hasCard(card.id)) {
          byRarity[rarity].collected++;
        }
      }
    });

    return { total, collected, byRarity };
  }, [heroCards, regularCarCards, isDemoMode, hasCard, userCards]);

  // Filtrowane karty na podstawie wyboru użytkownika
  const filteredHeroCards = useMemo(() => {
    if (collectionFilter === 'all') return heroCards;
    if (collectionFilter === 'owned') {
      return heroCards.filter(c => !isDemoMode && hasCard(c.id));
    }
    return heroCards.filter(c => isDemoMode || !hasCard(c.id));
  }, [heroCards, collectionFilter, isDemoMode, hasCard]);

  const filteredBrandGroups = useMemo(() => {
    if (collectionFilter === 'all') return brandGroups;

    return brandGroups
      .map(group => ({
        ...group,
        cards: group.cards.filter(card => {
          if (collectionFilter === 'owned') {
            return !isDemoMode && hasCard(card.id);
          }
          return isDemoMode || !hasCard(card.id);
        }),
      }))
      .filter(group => group.cards.length > 0); // Ukryj puste grupy
  }, [brandGroups, collectionFilter, isDemoMode, hasCard]);

  // Sprawdź czy karta jest wyprzedana (limit wyczerpany)
  const isCardSoldOut = (card: CollectibleCard): boolean => {
    if (!card.total_supply) return false; // Brak limitu = zawsze dostępna
    const soldCount = card.sold_count || 0;
    return soldCount >= card.total_supply;
  };

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

  // Otwórz szczegóły karty i załaduj galerię
  const openCardDetails = async (card: CollectibleCard) => {
    setSelectedCard(card);
    setCardImages([]);
    setCurrentImageIndex(0);
    setShowGallery(false);

    // Załaduj galerię tylko dla posiadanych kart
    const owned = !isDemoMode && hasCard(card.id);
    if (owned && card.card_type === 'car') {
      setLoadingImages(true);
      const images = await fetchCardImages(card.id);
      setCardImages(images);
      setLoadingImages(false);
    }
  };

  // Pobierz obraz jako tapetę
  const downloadImage = async (imageUrl: string, fileName: string) => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download error:', error);
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
        onClick={() => openCardDetails(card)}
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
        onClick={() => openCardDetails(card)}
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
        onClick={() => openCardDetails(card)}
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
              {!owned && !isDemoMode && isCardSoldOut(card) ? (
                <span className="text-xs font-medium text-orange-400">W kolekcji gracza</span>
              ) : (
                <span className="text-xs font-medium text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500">+{card.points} XP</span>
              )}
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
      <div className="flex items-center gap-4 mb-6">
        <div className="w-14 h-14 rounded-xl bg-purple-500/20 flex items-center justify-center flex-shrink-0">
          <Layers className="w-7 h-7 text-purple-500" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Kolekcja Kart</h1>
          <p className="text-dark-400">Zbieraj karty i wspieraj Turbo Pomoc!</p>
        </div>
      </div>

      {/* Turbo Bitwy Link */}
      <Link href="/battles">
        <Card className="mb-4 border-orange-500/50 hover:border-orange-400 transition-colors">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-orange-500/20 flex items-center justify-center flex-shrink-0">
              <Swords className="w-7 h-7 text-orange-500" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-white text-lg">Turbo Bitwy</h3>
              <p className="text-sm text-dark-300">
                Wyzwij gracza i walcz o XP!
              </p>
              <p className="text-xs text-orange-400 mt-1">
                Postaw swoje karty
              </p>
            </div>
            <ChevronRight className="w-5 h-5 text-orange-400 flex-shrink-0" />
          </div>
        </Card>
      </Link>

      {/* Mystery Garage Link */}
      <Link href="/mystery">
        <Card className="mb-6 border-emerald-500/50 hover:border-emerald-400 transition-colors">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
              <span className="text-3xl animate-wiggle-intense">🎁</span>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-white text-lg">Mystery Garage</h3>
              <p className="text-sm text-dark-300">
                Kup pakiet losowych kart
              </p>
              <p className="text-xs text-emerald-400 mt-1">
                od 15 zł • 3-10 kart
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
          {/* === STATYSTYKI SAMOCHODÓW === */}
          <Card>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Car className="w-5 h-5 text-turbo-400" />
                <span className="font-semibold text-white">Karty samochodów</span>
              </div>
              <span className="text-turbo-400 font-bold">
                {allCarStats.collected}/{allCarStats.total}
              </span>
            </div>
            <ProgressBar value={allCarStats.total > 0 ? Math.round((allCarStats.collected / allCarStats.total) * 100) : 0} />

            <div className="grid grid-cols-4 gap-2 mt-4">
              {(Object.keys(RARITY_CONFIG) as CardRarity[]).map(rarity => {
                const config = RARITY_CONFIG[rarity];
                const rarityStats = allCarStats.byRarity[rarity];
                return (
                  <div key={rarity} className={`text-center p-2 rounded-lg ${config.bgColor}`}>
                    <div className="text-lg">{config.icon}</div>
                    <div className={`text-[10px] ${config.color} opacity-70`}>
                      {config.name}
                    </div>
                    <div className={`text-xs font-medium ${config.color}`}>
                      {rarityStats.collected}/{rarityStats.total}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Filtry kolekcji + widok siatki */}
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => setCollectionFilter(collectionFilter === 'owned' ? 'all' : 'owned')}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium transition-colors ${
                  collectionFilter === 'owned'
                    ? 'bg-green-500 text-white'
                    : 'bg-dark-700 text-dark-300 hover:bg-dark-600'
                }`}
              >
                <CheckCircle className="w-5 h-5" />
                Twoja kolekcja ({allCarStats.collected})
              </button>
              <button
                onClick={() => setCollectionFilter(collectionFilter === 'to_collect' ? 'all' : 'to_collect')}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium transition-colors ${
                  collectionFilter === 'to_collect'
                    ? 'bg-turbo-500 text-white'
                    : 'bg-dark-700 text-dark-300 hover:bg-dark-600'
                }`}
              >
                <Lock className="w-5 h-5" />
                Do zdobycia ({allCarStats.total - allCarStats.collected})
              </button>

              {/* Przełącznik widoku siatki */}
              <div className="flex bg-dark-700 rounded-xl p-1">
                <button
                  onClick={() => setGridColumns(2)}
                  className={`p-2 rounded-lg transition-colors ${
                    gridColumns === 2
                      ? 'bg-dark-600 text-white'
                      : 'text-dark-400 hover:text-white'
                  }`}
                  title="2 kolumny"
                >
                  <Grid2X2 className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setGridColumns(3)}
                  className={`p-2 rounded-lg transition-colors ${
                    gridColumns === 3
                      ? 'bg-dark-600 text-white'
                      : 'text-dark-400 hover:text-white'
                  }`}
                  title="3 kolumny"
                >
                  <Grid3X3 className="w-5 h-5" />
                </button>
              </div>
            </div>
          </Card>

          {/* === TURBO HEROES === */}
          {filteredHeroCards.length > 0 && (
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
                {filteredHeroCards.map(renderHeroCard)}
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

            {/* Karty pogrupowane po markach */}
            {filteredBrandGroups.length > 0 ? (
              filteredBrandGroups.map(group => (
                <div key={group.brand} className="mb-6">
                  {/* Nagłówek marki */}
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-semibold text-white">{group.brand}</h3>
                    <span className="text-xs text-dark-500">
                      {group.collected}/{group.cards.length}
                    </span>
                  </div>

                  {/* Siatka kart */}
                  <div className={`grid gap-3 ${gridColumns === 3 ? 'grid-cols-3' : 'grid-cols-2'}`}>
                    {group.cards.map(renderCarCard)}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-dark-700 rounded-full flex items-center justify-center mx-auto mb-4">
                  {collectionFilter === 'owned' ? (
                    <Car className="w-8 h-8 text-dark-500" />
                  ) : (
                    <CheckCircle className="w-8 h-8 text-green-500" />
                  )}
                </div>
                <p className="text-dark-400">
                  {collectionFilter === 'owned'
                    ? 'Nie masz jeszcze żadnych kart samochodów'
                    : 'Masz już wszystkie dostępne karty!'}
                </p>
                <button
                  onClick={() => setCollectionFilter('all')}
                  className="mt-4 text-turbo-400 hover:text-turbo-300 text-sm"
                >
                  Pokaż wszystkie karty
                </button>
              </div>
            )}
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
                    <div className={`text-[10px] ${config.color} opacity-70`}>
                      {config.name}
                    </div>
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
            const categoryCards = displayAchievementCards
              .filter(c => c.category === category)
              .sort((a, b) => {
                // Sortuj - posiadane pierwsze
                const aOwned = !isDemoMode && hasCard(a.id) ? 0 : 1;
                const bOwned = !isDemoMode && hasCard(b.id) ? 0 : 1;
                return aOwned - bOwned;
              });
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

                      {!owned && !isDemoMode && isCardSoldOut(selectedCard) && (
                        <div className="absolute bottom-2 left-2 right-2 bg-orange-500/90 backdrop-blur-sm py-1.5 px-3 rounded-lg">
                          <p className="text-white text-xs font-medium text-center">
                            Karta w kolekcji innego gracza
                          </p>
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
                        {selectedCard.total_supply && (
                          <span className="text-xs text-dark-500">
                            {selectedCard.sold_count || 0}/{selectedCard.total_supply} szt.
                            {isCardSoldOut(selectedCard) && <span className="text-orange-400 ml-1">(wyprzedane)</span>}
                          </span>
                        )}
                        <span className="ml-auto">
                          {!owned && !isDemoMode && isCardSoldOut(selectedCard) ? (
                            <span className="font-bold text-orange-400">W kolekcji gracza</span>
                          ) : (
                            <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500">+{selectedCard.points} XP</span>
                          )}
                        </span>
                      </div>

                      {/* === ROZSZERZONE INFO (tylko dla posiadanych kart) === */}
                      {owned && (selectedCard.car_engine || selectedCard.car_acceleration || selectedCard.car_weight || selectedCard.car_drivetrain || selectedCard.car_cylinders) && (
                        <div className="mt-4 pt-4 border-t border-dark-700">
                          <div className="flex items-center gap-2 mb-3">
                            <Info className="w-4 h-4 text-turbo-400" />
                            <span className="text-sm font-semibold text-turbo-400">Szczegóły techniczne</span>
                          </div>
                          <div className="grid grid-cols-2 gap-3 text-sm">
                            {selectedCard.car_engine && (
                              <div className="flex items-center gap-2">
                                <Fuel className="w-4 h-4 text-orange-400" />
                                <div>
                                  <p className="text-dark-500 text-xs">Silnik</p>
                                  <p className="text-white font-medium">{selectedCard.car_engine}</p>
                                </div>
                              </div>
                            )}
                            {selectedCard.car_cylinders && (
                              <div className="flex items-center gap-2">
                                <Cog className="w-4 h-4 text-slate-400" />
                                <div>
                                  <p className="text-dark-500 text-xs">Cylindry</p>
                                  <p className="text-white font-medium">{selectedCard.car_cylinders}</p>
                                </div>
                              </div>
                            )}
                            {selectedCard.car_acceleration && (
                              <div className="flex items-center gap-2">
                                <Activity className="w-4 h-4 text-green-400" />
                                <div>
                                  <p className="text-dark-500 text-xs">0-100 km/h</p>
                                  <p className="text-white font-medium">{selectedCard.car_acceleration}s</p>
                                </div>
                              </div>
                            )}
                            {selectedCard.car_weight && (
                              <div className="flex items-center gap-2">
                                <Weight className="w-4 h-4 text-purple-400" />
                                <div>
                                  <p className="text-dark-500 text-xs">Masa</p>
                                  <p className="text-white font-medium">{selectedCard.car_weight} kg</p>
                                </div>
                              </div>
                            )}
                            {selectedCard.car_drivetrain && (
                              <div className="col-span-2 flex items-center gap-2">
                                <Car className="w-4 h-4 text-cyan-400" />
                                <div>
                                  <p className="text-dark-500 text-xs">Napęd</p>
                                  <p className="text-white font-medium">{selectedCard.car_drivetrain}</p>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* === CIEKAWOSTKA (tylko dla posiadanych kart) === */}
                      {owned && selectedCard.car_fun_fact && (
                        <div className="mt-4 p-3 rounded-xl bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20">
                          <p className="text-xs text-purple-400 font-medium mb-1">💡 Ciekawostka</p>
                          <p className="text-sm text-dark-300">{selectedCard.car_fun_fact}</p>
                        </div>
                      )}

                      {/* === GALERIA ZDJĘĆ (tylko dla posiadanych kart) === */}
                      {owned && (cardImages.length > 0 || loadingImages) && (
                        <div className="mt-4 pt-4 border-t border-dark-700">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <ImageIcon className="w-4 h-4 text-emerald-400" />
                              <span className="text-sm font-semibold text-emerald-400">Galeria ({cardImages.length})</span>
                            </div>
                            {cardImages.length > 0 && (
                              <button
                                onClick={() => setShowGallery(true)}
                                className="text-xs text-turbo-400 hover:text-turbo-300"
                              >
                                Zobacz wszystkie
                              </button>
                            )}
                          </div>

                          {loadingImages ? (
                            <div className="flex items-center justify-center py-4">
                              <div className="w-6 h-6 border-2 border-turbo-500 border-t-transparent rounded-full animate-spin" />
                            </div>
                          ) : (
                            <div className="grid grid-cols-3 gap-2">
                              {cardImages.slice(0, 3).map((img, idx) => (
                                <button
                                  key={img.id}
                                  onClick={() => {
                                    setCurrentImageIndex(idx);
                                    setShowGallery(true);
                                  }}
                                  className="aspect-video rounded-lg overflow-hidden bg-dark-700 hover:ring-2 hover:ring-turbo-500 transition-all"
                                >
                                  <img
                                    src={img.image_url}
                                    alt={`Zdjęcie ${idx + 1}`}
                                    className="w-full h-full object-cover"
                                  />
                                </button>
                              ))}
                              {cardImages.length > 3 && (
                                <button
                                  onClick={() => setShowGallery(true)}
                                  className="aspect-video rounded-lg bg-dark-700 flex items-center justify-center text-dark-400 hover:bg-dark-600 transition-colors"
                                >
                                  +{cardImages.length - 3}
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      )}

                      {/* === DOWNLOAD GŁÓWNEGO ZDJĘCIA (tylko dla posiadanych kart) === */}
                      {owned && selectedCard.image_url && (
                        <button
                          onClick={() => downloadImage(selectedCard.image_url!, `${selectedCard.car_brand}-${selectedCard.car_model}-wallpaper.jpg`)}
                          className="mt-4 w-full flex items-center justify-center gap-2 py-2 px-4 rounded-xl bg-dark-700 hover:bg-dark-600 text-dark-300 hover:text-white transition-colors"
                        >
                          <Download className="w-4 h-4" />
                          <span className="text-sm">Pobierz jako tapetę</span>
                        </button>
                      )}

                      {selectedCard.is_purchasable && selectedCard.price && !owned && !isDemoMode && !isCardSoldOut(selectedCard) && (
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
                          <p className="text-dark-400">
                            {isCardSoldOut(selectedCard) ? 'Karta w kolekcji innego gracza' : 'Nie posiadasz tej karty'}
                          </p>
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
                      {!owned && !isDemoMode && isCardSoldOut(selectedCard) ? (
                        <span className="font-bold text-orange-400">W kolekcji gracza</span>
                      ) : (
                        <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500">+{selectedCard.points} XP</span>
                      )}
                    </div>

                    {selectedCard.total_supply && (
                      <div className="mt-3 pt-3 border-t border-dark-700">
                        <p className="text-xs text-dark-500 text-center">
                          Limitowana edycja: {selectedCard.sold_count || 0}/{selectedCard.total_supply} sztuk
                          {isCardSoldOut(selectedCard) && <span className="text-orange-400 ml-1">(wyprzedane)</span>}
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

      {/* === MODAL: Galeria pełnoekranowa === */}
      {showGallery && cardImages.length > 0 && (
        <div className="fixed inset-0 z-[60] bg-black flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 bg-dark-900/50">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowGallery(false)}
                className="p-2 hover:bg-dark-700 rounded-lg transition-colors"
              >
                <X className="w-6 h-6 text-white" />
              </button>
              <span className="text-white font-medium">
                {selectedCard?.car_brand} {selectedCard?.car_model}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-dark-400 text-sm">
                {currentImageIndex + 1} / {cardImages.length}
              </span>
              <button
                onClick={() => downloadImage(cardImages[currentImageIndex].image_url, `${selectedCard?.car_brand}-${selectedCard?.car_model}-${currentImageIndex + 1}.jpg`)}
                className="p-2 hover:bg-dark-700 rounded-lg transition-colors"
              >
                <Download className="w-5 h-5 text-white" />
              </button>
            </div>
          </div>

          {/* Image */}
          <div className="flex-1 flex items-center justify-center p-4 relative">
            <img
              src={cardImages[currentImageIndex].image_url}
              alt={`Zdjęcie ${currentImageIndex + 1}`}
              className="max-w-full max-h-full object-contain"
            />

            {/* Navigation arrows */}
            {cardImages.length > 1 && (
              <>
                <button
                  onClick={() => setCurrentImageIndex(prev => prev > 0 ? prev - 1 : cardImages.length - 1)}
                  className="absolute left-4 p-3 bg-dark-800/80 hover:bg-dark-700 rounded-full transition-colors"
                >
                  <ChevronLeft className="w-6 h-6 text-white" />
                </button>
                <button
                  onClick={() => setCurrentImageIndex(prev => prev < cardImages.length - 1 ? prev + 1 : 0)}
                  className="absolute right-4 p-3 bg-dark-800/80 hover:bg-dark-700 rounded-full transition-colors"
                >
                  <ChevronRight className="w-6 h-6 text-white" />
                </button>
              </>
            )}
          </div>

          {/* Thumbnails */}
          <div className="p-4 bg-dark-900/50">
            <div className="flex gap-2 justify-center overflow-x-auto pb-2">
              {cardImages.map((img, idx) => (
                <button
                  key={img.id}
                  onClick={() => setCurrentImageIndex(idx)}
                  className={`w-16 h-12 rounded-lg overflow-hidden flex-shrink-0 transition-all ${
                    idx === currentImageIndex ? 'ring-2 ring-turbo-500 scale-105' : 'opacity-60 hover:opacity-100'
                  }`}
                >
                  <img
                    src={img.image_url}
                    alt={`Miniatura ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
