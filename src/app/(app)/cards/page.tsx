'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useCards, RARITY_CONFIG } from '@/hooks/useCards';
import { Card, Badge, ProgressBar } from '@/components/ui';
import { CardRarity, CollectibleCard } from '@/types';
import {
  Layers,
  Star,
  Lock,
  Sparkles,
  Filter,
  Grid3X3,
  List,
  X,
} from 'lucide-react';

type ViewMode = 'grid' | 'list';
type FilterRarity = CardRarity | 'all';

// Przykładowe karty do pokazania gdy baza jest pusta
const DEMO_CARDS: CollectibleCard[] = [
  {
    id: 'demo-1',
    name: 'Turbo Starter',
    description: 'Pierwsza karta każdego gracza. Początek wielkiej przygody!',
    rarity: 'common',
    category: 'Podstawowe',
    points: 10,
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 'demo-2',
    name: 'Speed Demon',
    description: 'Karta dla tych, którzy ukończyli 5 misji.',
    rarity: 'rare',
    category: 'Osiągnięcia',
    points: 25,
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 'demo-3',
    name: 'Mistrz Quizów',
    description: 'Zdobywana za perfekcyjny wynik w quizie.',
    rarity: 'epic',
    category: 'Osiągnięcia',
    points: 50,
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 'demo-4',
    name: 'Legenda Turbo',
    description: 'Najrzadsza karta. Tylko dla prawdziwych mistrzów.',
    rarity: 'legendary',
    category: 'Legendarne',
    points: 100,
    total_supply: 10,
    is_active: true,
    created_at: new Date().toISOString(),
  },
];

export default function CardsPage() {
  const { profile } = useAuth();
  const { allCards, userCards, loading, hasCard, getUserCardCount, getCollectionStats } = useCards({
    userId: profile?.id,
  });

  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [filterRarity, setFilterRarity] = useState<FilterRarity>('all');
  const [selectedCard, setSelectedCard] = useState<CollectibleCard | null>(null);

  // Użyj demo kart jeśli brak kart w bazie
  const displayCards = allCards.length > 0 ? allCards : DEMO_CARDS;
  const isDemoMode = allCards.length === 0;

  // Filtruj karty
  const filteredCards = filterRarity === 'all'
    ? displayCards
    : displayCards.filter(c => c.rarity === filterRarity);

  // Statystyki
  const stats = getCollectionStats();
  const collectionProgress = stats.total > 0 ? Math.round((stats.collected / stats.total) * 100) : 0;

  // Grupuj karty według kategorii
  const categories = Array.from(new Set(filteredCards.map(c => c.category)));

  const renderCard = (card: CollectibleCard) => {
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
          {/* Card Image / Placeholder */}
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

            {/* Locked overlay */}
            {!owned && !isDemoMode && (
              <div className="absolute inset-0 bg-dark-900/60 flex items-center justify-center">
                <Lock className="w-8 h-8 text-dark-400" />
              </div>
            )}

            {/* Rarity badge */}
            <div className={`absolute top-2 right-2 px-2 py-0.5 rounded-full text-xs font-bold ${config.bgColor} ${config.color}`}>
              {config.name}
            </div>

            {/* Count badge */}
            {count > 1 && (
              <div className="absolute top-2 left-2 w-6 h-6 rounded-full bg-turbo-500 text-white text-xs font-bold flex items-center justify-center">
                x{count}
              </div>
            )}
          </div>

          {/* Card info */}
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
                To przykładowe karty. Administrator może dodać prawdziwe karty w panelu admina.
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Collection Progress */}
      <Card className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Star className="w-5 h-5 text-yellow-500" />
            <span className="font-semibold text-white">Postęp kolekcji</span>
          </div>
          <span className="text-turbo-400 font-bold">
            {stats.collected}/{stats.total}
          </span>
        </div>
        <ProgressBar value={collectionProgress} />

        {/* Rarity breakdown */}
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

      {/* Filters & View Toggle */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
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

        <div className="flex items-center gap-1 bg-dark-700 rounded-lg p-1">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-1.5 rounded ${viewMode === 'grid' ? 'bg-dark-600 text-white' : 'text-dark-400'}`}
          >
            <Grid3X3 className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-1.5 rounded ${viewMode === 'list' ? 'bg-dark-600 text-white' : 'text-dark-400'}`}
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Cards Display */}
      {loading ? (
        <div className="grid grid-cols-2 gap-3">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="aspect-[3/4] bg-dark-700 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : viewMode === 'grid' ? (
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
                  {categoryCards.map(renderCard)}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="space-y-2">
          {filteredCards.map(card => {
            const owned = !isDemoMode && hasCard(card.id);
            const count = !isDemoMode ? getUserCardCount(card.id) : 0;
            const config = RARITY_CONFIG[card.rarity];

            return (
              <button
                key={card.id}
                onClick={() => setSelectedCard(card)}
                className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-colors ${
                  owned
                    ? `${config.borderColor} ${config.bgColor}`
                    : 'border-dark-700 bg-dark-800 opacity-60'
                }`}
              >
                <div className={`w-12 h-12 rounded-lg ${config.bgColor} flex items-center justify-center`}>
                  {owned ? (
                    <span className="text-2xl">{config.icon}</span>
                  ) : (
                    <Lock className="w-5 h-5 text-dark-500" />
                  )}
                </div>
                <div className="flex-1 text-left">
                  <p className={`font-medium ${owned ? 'text-white' : 'text-dark-400'}`}>
                    {card.name}
                  </p>
                  <p className="text-xs text-dark-500">{card.category}</p>
                </div>
                <div className="text-right">
                  <Badge variant={card.rarity === 'legendary' ? 'warning' : card.rarity === 'epic' ? 'turbo' : card.rarity === 'rare' ? 'info' : 'default'}>
                    {config.name}
                  </Badge>
                  {count > 1 && (
                    <p className="text-xs text-turbo-400 mt-1">x{count}</p>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Card Detail Modal */}
      {selectedCard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80" onClick={() => setSelectedCard(null)}>
          <div
            className="relative w-full max-w-sm"
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

              return (
                <div
                  className={`rounded-2xl border-2 overflow-hidden ${config.borderColor} ${
                    owned && selectedCard.rarity !== 'common' ? `shadow-2xl ${config.glowColor}` : ''
                  }`}
                >
                  {/* Card Image */}
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

                    {/* Rarity banner */}
                    <div className={`absolute top-4 right-4 px-3 py-1 rounded-full font-bold ${config.bgColor} ${config.color}`}>
                      {config.name}
                    </div>

                    {count > 1 && (
                      <div className="absolute top-4 left-4 w-8 h-8 rounded-full bg-turbo-500 text-white font-bold flex items-center justify-center">
                        x{count}
                      </div>
                    )}
                  </div>

                  {/* Card Details */}
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
