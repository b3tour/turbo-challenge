'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useCards, RARITY_CONFIG } from '@/hooks/useCards';
import { Card, Badge, ProgressBar } from '@/components/ui';
import { CardRarity, CollectibleCard, CardType } from '@/types';
import {
  Layers,
  Star,
  Lock,
  Sparkles,
  Filter,
  X,
  Car,
  Award,
  Gauge,
  Zap,
  Timer,
} from 'lucide-react';

type ViewTab = 'achievement' | 'car';
type FilterRarity = CardRarity | 'all';

// Przykładowe karty osiągnięć
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
  {
    id: 'demo-a3',
    name: 'Mistrz Quizów',
    description: 'Zdobywana za perfekcyjny wynik w quizie.',
    rarity: 'epic',
    card_type: 'achievement',
    category: 'Osiągnięcia',
    points: 50,
    is_active: true,
    created_at: new Date().toISOString(),
  },
];

// Przykładowe karty samochodów
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
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 'demo-c3',
    name: 'Ford Mustang GT',
    description: 'Amerykański muscle car',
    rarity: 'rare',
    card_type: 'car',
    category: 'Ford',
    points: 50,
    car_brand: 'Ford',
    car_model: 'Mustang GT',
    car_horsepower: 450,
    car_torque: 570,
    car_max_speed: 250,
    car_year: 2024,
    is_active: true,
    created_at: new Date().toISOString(),
  },
];

export default function CardsPage() {
  const { profile } = useAuth();
  const { allCards, userCards, loading, hasCard, getUserCardCount, getCollectionStats, getCardsByType } = useCards({
    userId: profile?.id,
  });

  const [activeTab, setActiveTab] = useState<ViewTab>('achievement');
  const [filterRarity, setFilterRarity] = useState<FilterRarity>('all');
  const [selectedCard, setSelectedCard] = useState<CollectibleCard | null>(null);

  // Pobierz karty według typu
  const achievementCards = getCardsByType('achievement');
  const carCards = getCardsByType('car');

  // Użyj demo kart jeśli brak kart w bazie
  const displayAchievementCards = achievementCards.length > 0 ? achievementCards : DEMO_ACHIEVEMENT_CARDS;
  const displayCarCards = carCards.length > 0 ? carCards : DEMO_CAR_CARDS;
  const isDemoMode = allCards.length === 0;

  // Aktywne karty do wyświetlenia
  const activeCards = activeTab === 'achievement' ? displayAchievementCards : displayCarCards;

  // Filtruj karty
  const filteredCards = filterRarity === 'all'
    ? activeCards
    : activeCards.filter(c => c.rarity === filterRarity);

  // Statystyki dla aktywnej zakładki
  const stats = getCollectionStats(activeTab);

  // Grupuj karty według kategorii
  const categories = Array.from(new Set(filteredCards.map(c => c.category)));

  // Render karty osiągnięcia (pionowa)
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
        <div
          className={`relative rounded-xl border-2 overflow-hidden ${config.borderColor} ${
            owned && card.rarity !== 'common' ? `shadow-lg ${config.glowColor}` : ''
          }`}
        >
          <div className={`aspect-[3/4] ${config.bgColor} flex items-center justify-center relative`}>
            {card.image_url ? (
              <img
                src={card.image_url}
                alt={card.name}
                className={`w-full h-full object-cover ${!owned ? 'grayscale' : ''}`}
              />
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
              <span className={`text-xs font-medium ${config.color}`}>
                +{card.points} pkt
              </span>
            </div>
          </div>
        </div>
      </button>
    );
  };

  // Render karty samochodu (pozioma - styl Turbo)
  const renderCarCard = (card: CollectibleCard) => {
    const owned = !isDemoMode && hasCard(card.id);
    const count = !isDemoMode ? getUserCardCount(card.id) : 0;
    const config = RARITY_CONFIG[card.rarity];

    return (
      <button
        key={card.id}
        onClick={() => setSelectedCard(card)}
        className={`relative group text-left transition-all duration-300 w-full ${
          owned ? 'hover:scale-[1.02]' : 'opacity-60 hover:opacity-80'
        }`}
      >
        <div
          className={`relative rounded-xl border-2 overflow-hidden ${config.borderColor} ${
            owned && card.rarity !== 'common' ? `shadow-lg ${config.glowColor}` : ''
          }`}
        >
          {/* Układ poziomy - zdjęcie po lewej, dane po prawej */}
          <div className="flex h-32">
            {/* Zdjęcie samochodu */}
            <div className={`w-40 h-full ${config.bgColor} flex items-center justify-center relative flex-shrink-0`}>
              {card.image_url ? (
                <img
                  src={card.image_url}
                  alt={card.name}
                  className={`w-full h-full object-cover ${!owned ? 'grayscale' : ''}`}
                />
              ) : (
                <Car className={`w-12 h-12 ${config.color}`} />
              )}

              {!owned && !isDemoMode && (
                <div className="absolute inset-0 bg-dark-900/60 flex items-center justify-center">
                  <Lock className="w-8 h-8 text-dark-400" />
                </div>
              )}

              {/* Badge rzadkości */}
              <div className={`absolute top-2 left-2 px-1.5 py-0.5 rounded text-[10px] font-bold ${config.bgColor} ${config.color}`}>
                {config.name}
              </div>

              {count > 1 && (
                <div className="absolute bottom-2 left-2 w-5 h-5 rounded-full bg-turbo-500 text-white text-[10px] font-bold flex items-center justify-center">
                  x{count}
                </div>
              )}
            </div>

            {/* Dane samochodu */}
            <div className="flex-1 bg-dark-800 p-3 flex flex-col justify-between">
              {/* Nagłówek - marka i model */}
              <div>
                <p className={`text-xs ${config.color} font-medium`}>{card.car_brand || card.category}</p>
                <h3 className={`font-bold text-base truncate ${owned ? 'text-white' : 'text-dark-400'}`}>
                  {card.car_model || card.name}
                </h3>
              </div>

              {/* Statystyki */}
              <div className="grid grid-cols-3 gap-2 mt-2">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1">
                    <Zap className="w-3 h-3 text-yellow-500" />
                    <span className="text-white font-bold text-sm">{card.car_horsepower || '?'}</span>
                  </div>
                  <p className="text-[10px] text-dark-500">KM</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1">
                    <Gauge className="w-3 h-3 text-blue-500" />
                    <span className="text-white font-bold text-sm">{card.car_torque || '?'}</span>
                  </div>
                  <p className="text-[10px] text-dark-500">Nm</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1">
                    <Timer className="w-3 h-3 text-red-500" />
                    <span className="text-white font-bold text-sm">{card.car_max_speed || '?'}</span>
                  </div>
                  <p className="text-[10px] text-dark-500">km/h</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </button>
    );
  };

  return (
    <div className="py-4 pb-24">
      {/* Header */}
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-purple-500/20 mb-3">
          <Layers className="w-8 h-8 text-purple-500" />
        </div>
        <h1 className="text-2xl font-bold text-white">Kolekcja Kart</h1>
        <p className="text-dark-400 mt-1">Zbieraj karty i uzupełniaj kolekcję!</p>
      </div>

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
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => { setActiveTab('achievement'); setFilterRarity('all'); }}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium transition-colors ${
            activeTab === 'achievement'
              ? 'bg-purple-500 text-white'
              : 'bg-dark-700 text-dark-300 hover:bg-dark-600'
          }`}
        >
          <Award className="w-5 h-5" />
          Osiągnięcia
        </button>
        <button
          onClick={() => { setActiveTab('car'); setFilterRarity('all'); }}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium transition-colors ${
            activeTab === 'car'
              ? 'bg-turbo-500 text-white'
              : 'bg-dark-700 text-dark-300 hover:bg-dark-600'
          }`}
        >
          <Car className="w-5 h-5" />
          Samochody
        </button>
      </div>

      {/* Collection Progress */}
      <Card className="mb-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Star className="w-5 h-5 text-yellow-500" />
            <span className="font-semibold text-white">
              {activeTab === 'achievement' ? 'Karty osiągnięć' : 'Karty samochodów'}
            </span>
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

      {/* Filters */}
      <div className="flex items-center gap-2 mb-4">
        <Filter className="w-4 h-4 text-dark-400" />
        <select
          value={filterRarity}
          onChange={e => setFilterRarity(e.target.value as FilterRarity)}
          className="bg-dark-700 text-white text-sm rounded-lg px-3 py-1.5 border border-dark-600 focus:border-turbo-500 focus:outline-none"
        >
          <option value="all">Wszystkie</option>
          <option value="common">Zwykłe</option>
          <option value="rare">Rzadkie</option>
          <option value="epic">Epickie</option>
          <option value="legendary">Legendarne</option>
        </select>
      </div>

      {/* Cards Display */}
      {loading ? (
        <div className={activeTab === 'achievement' ? 'grid grid-cols-2 gap-3' : 'space-y-3'}>
          {[1, 2, 3, 4].map(i => (
            <div
              key={i}
              className={`bg-dark-700 rounded-xl animate-pulse ${
                activeTab === 'achievement' ? 'aspect-[3/4]' : 'h-32'
              }`}
            />
          ))}
        </div>
      ) : activeTab === 'achievement' ? (
        // Karty osiągnięć - siatka pionowych kart
        <div className="space-y-6">
          {categories.map(category => {
            const categoryCards = filteredCards.filter(c => c.category === category);
            if (categoryCards.length === 0) return null;

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
      ) : (
        // Karty samochodów - lista poziomych kart
        <div className="space-y-6">
          {categories.map(category => {
            const categoryCards = filteredCards.filter(c => c.category === category);
            if (categoryCards.length === 0) return null;

            return (
              <div key={category}>
                <h2 className="text-sm font-semibold text-dark-400 uppercase tracking-wider mb-3">
                  {category}
                </h2>
                <div className="space-y-3">
                  {categoryCards.map(renderCarCard)}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Card Detail Modal */}
      {selectedCard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80" onClick={() => setSelectedCard(null)}>
          <div
            className="relative w-full max-w-md"
            onClick={e => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedCard(null)}
              className="absolute -top-10 right-0 text-white/60 hover:text-white"
            >
              <X className="w-6 h-6" />
            </button>

            {(() => {
              const config = RARITY_CONFIG[selectedCard.rarity];
              const owned = !isDemoMode && hasCard(selectedCard.id);
              const count = !isDemoMode ? getUserCardCount(selectedCard.id) : 0;

              // Karta samochodu - modal poziomy
              if (selectedCard.card_type === 'car') {
                return (
                  <div className={`rounded-2xl border-2 overflow-hidden ${config.borderColor} ${
                    owned && selectedCard.rarity !== 'common' ? `shadow-2xl ${config.glowColor}` : ''
                  }`}>
                    {/* Zdjęcie */}
                    <div className={`aspect-video ${config.bgColor} flex items-center justify-center relative`}>
                      {selectedCard.image_url ? (
                        <img
                          src={selectedCard.image_url}
                          alt={selectedCard.name}
                          className={`w-full h-full object-cover ${!owned ? 'grayscale' : ''}`}
                        />
                      ) : (
                        <Car className={`w-24 h-24 ${config.color}`} />
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

                    {/* Dane */}
                    <div className="p-4 bg-dark-800">
                      <p className={`text-sm ${config.color} font-medium`}>{selectedCard.car_brand}</p>
                      <h2 className="text-2xl font-bold text-white mb-1">{selectedCard.car_model}</h2>
                      {selectedCard.car_year && (
                        <p className="text-dark-500 text-sm mb-4">Rok: {selectedCard.car_year}</p>
                      )}

                      {/* Statystyki */}
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

                      <div className="flex items-center justify-between mt-4">
                        <span className="text-dark-500">{selectedCard.category}</span>
                        <span className={`font-bold ${config.color}`}>+{selectedCard.points} pkt</span>
                      </div>
                    </div>
                  </div>
                );
              }

              // Karta osiągnięcia - modal pionowy
              return (
                <div
                  className={`rounded-2xl border-2 overflow-hidden ${config.borderColor} ${
                    owned && selectedCard.rarity !== 'common' ? `shadow-2xl ${config.glowColor}` : ''
                  }`}
                >
                  <div className={`aspect-[3/4] ${config.bgColor} flex items-center justify-center relative`}>
                    {selectedCard.image_url ? (
                      <img
                        src={selectedCard.image_url}
                        alt={selectedCard.name}
                        className={`w-full h-full object-cover ${!owned ? 'grayscale' : ''}`}
                      />
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
    </div>
  );
}
