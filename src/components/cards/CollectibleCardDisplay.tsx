'use client';

import { useState } from 'react';
import { CollectibleCard, CardRarity } from '@/types';
import { RARITY_CONFIG } from '@/hooks/useCards';
import {
  Car,
  Lock,
  Zap,
  Gauge,
  Timer,
  Crown,
  User,
  CheckCircle,
  Clock,
  Award,
} from 'lucide-react';

// Konfiguracja efektów według rzadkości
const RARITY_EFFECTS: Record<CardRarity, {
  cardClass: string;
  frameClass: string;
  showSparkles: boolean;
  statsVisible: boolean;
}> = {
  common: {
    cardClass: '',
    frameClass: 'border-slate-500/50',
    showSparkles: false,
    statsVisible: true,
  },
  rare: {
    cardClass: 'card-shimmer',
    frameClass: 'border-blue-500',
    showSparkles: false,
    statsVisible: true,
  },
  epic: {
    cardClass: 'card-shimmer card-pulse-epic',
    frameClass: 'border-purple-500',
    showSparkles: false,
    statsVisible: true,
  },
  legendary: {
    cardClass: 'card-holographic card-glow-legendary',
    frameClass: 'border-yellow-500',
    showSparkles: true,
    statsVisible: true,
  },
};


interface CollectibleCardDisplayProps {
  card: CollectibleCard;
  owned?: boolean;
  pendingOrder?: boolean;
  count?: number;
  variant?: 'grid' | 'hero' | 'full';
  onClick?: () => void;
  isDemoMode?: boolean;
}

export function CollectibleCardDisplay({
  card,
  owned = false,
  pendingOrder = false,
  count = 1,
  variant = 'grid',
  onClick,
  isDemoMode = false,
}: CollectibleCardDisplayProps) {
  const [imageLoaded, setImageLoaded] = useState(false);

  const config = RARITY_CONFIG[card.rarity];
  const effects = RARITY_EFFECTS[card.rarity];

  // Oblicz procent dla statystyk (max wartości dla normalizacji)
  const maxHP = 1500;
  const maxTorque = 1500;
  const maxSpeed = 450;

  const hpPercent = Math.min(100, ((card.car_horsepower || 0) / maxHP) * 100);
  const torquePercent = Math.min(100, ((card.car_torque || 0) / maxTorque) * 100);
  const speedPercent = Math.min(100, ((card.car_max_speed || 0) / maxSpeed) * 100);

  // Generuj pozycje iskierek dla legendary
  const sparklePositions = effects.showSparkles ? [
    { top: '10%', left: '15%', delay: '0s' },
    { top: '20%', right: '20%', delay: '0.5s' },
    { top: '60%', left: '10%', delay: '1s' },
    { top: '70%', right: '15%', delay: '1.5s' },
    { top: '40%', left: '80%', delay: '0.7s' },
  ] : [];

  // === ACHIEVEMENT CARD (pionowa, bez car stats) ===
  if (card.card_type === 'achievement' && variant === 'grid') {
    return (
      <button
        onClick={onClick}
        className={`relative text-left transition-all duration-300 group ${
          owned ? 'hover:scale-[1.03]' : 'opacity-75 hover:opacity-100'
        }`}
      >
        <div className={`relative rounded-xl border-3 overflow-hidden ${effects.frameClass} ${effects.cardClass} ${
          owned ? 'shadow-xl' : ''
        }`} style={{ borderWidth: '3px' }}>
          {/* Iskierki dla legendary */}
          {sparklePositions.map((pos, i) => (
            <div
              key={i}
              className="sparkle-particle"
              style={{ ...pos, animationDelay: pos.delay }}
            />
          ))}

          {/* Obrazek lub ikona - proporcje 3:4 (pionowe) */}
          <div className="aspect-[3/4] relative">
            {card.image_url ? (
              <img
                src={card.image_url}
                alt={card.name}
                className={`w-full h-full object-cover transition-all duration-500 ${
                  !owned && !isDemoMode ? 'grayscale brightness-50' : ''
                } ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
                onLoad={() => setImageLoaded(true)}
              />
            ) : (
              <div className={`w-full h-full ${config.bgColor} flex items-center justify-center`}>
                <Award className={`w-12 h-12 ${config.color}`} />
              </div>
            )}

            {/* Lock overlay */}
            {!owned && !isDemoMode && (
              <div className="absolute inset-0 bg-dark-900/50 flex items-center justify-center">
                <Lock className="w-8 h-8 text-dark-400" />
              </div>
            )}

            {/* Posiadana */}
            {owned && (
              <div className="absolute top-2 left-2">
                <CheckCircle className="w-6 h-6 text-green-500 drop-shadow-lg" />
              </div>
            )}

            {/* Gradient overlay na dole */}
            <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-dark-900 to-transparent" />
          </div>

          {/* Info pod obrazkiem */}
          <div className="p-2.5 bg-dark-800">
            <h3 className={`font-bold text-sm truncate ${owned ? 'text-white' : 'text-dark-300'}`}>
              {card.name}
            </h3>
            <p className="text-xs text-dark-500 mt-0.5 truncate">{card.description}</p>
            <div className="flex items-center gap-1 mt-1">
              <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${config.bgColor} ${config.color}`}>
                {card.rarity.charAt(0).toUpperCase() + card.rarity.slice(1)}
              </span>
              {card.category && (
                <span className="text-[10px] text-dark-500">{card.category}</span>
              )}
            </div>
          </div>
        </div>
      </button>
    );
  }

  // === HERO VARIANT (pełna szerokość, 16:9) ===
  if (variant === 'hero') {
    return (
      <button
        onClick={onClick}
        className={`relative w-full text-left transition-all duration-300 ${
          owned ? 'hover:scale-[1.01]' : 'opacity-80 hover:opacity-100'
        }`}
      >
        <div className={`relative rounded-2xl border-4 overflow-hidden ${effects.frameClass} ${effects.cardClass} ${
          owned ? 'shadow-2xl' : ''
        }`}>
          {/* Iskierki dla legendary */}
          {sparklePositions.map((pos, i) => (
            <div
              key={i}
              className="sparkle-particle"
              style={{ ...pos, animationDelay: pos.delay }}
            />
          ))}

          {/* Zdjęcie 16:9 */}
          <div className="aspect-video relative speed-lines">
            {card.image_url ? (
              <img
                src={card.image_url}
                alt={card.name}
                className={`w-full h-full object-cover transition-all duration-500 ${
                  !owned && !isDemoMode ? 'grayscale brightness-50' : ''
                } ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
                onLoad={() => setImageLoaded(true)}
              />
            ) : (
              <div className={`w-full h-full ${config.bgColor} flex items-center justify-center`}>
                <div className="text-center">
                  <User className={`w-16 h-16 ${config.color} mx-auto`} />
                  <Car className={`w-10 h-10 ${config.color} mx-auto mt-2`} />
                </div>
              </div>
            )}

            {/* Lock overlay */}
            {!owned && !isDemoMode && (
              <div className="absolute inset-0 bg-dark-900/50 flex items-center justify-center">
                <Lock className="w-12 h-12 text-dark-400" />
              </div>
            )}

            {/* TURBO HERO badge */}
            <div className="absolute top-3 left-3">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-yellow-500 to-orange-500 text-white text-sm font-bold shadow-lg">
                <Crown className="w-4 h-4" />
                TURBO HERO
              </div>
            </div>

            {/* Gradient overlay na dole */}
            <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-dark-900 via-dark-900/80 to-transparent" />

            {/* Info na dole zdjęcia */}
            <div className="absolute bottom-0 left-0 right-0 p-4">
              <p className="text-yellow-400 text-sm font-medium">{card.hero_title}</p>
              <h3 className="text-2xl font-bold text-white">{card.hero_name || card.name}</h3>
              <p className="text-dark-300 mt-1">{card.car_brand} {card.car_model}</p>
            </div>
          </div>

          {/* Stats bar na dole karty */}
          {effects.statsVisible && (
            <div className="bg-dark-800 p-3 flex items-center justify-around text-sm">
              <div className="text-center">
                <Zap className="w-4 h-4 text-yellow-500 mx-auto" />
                <span className="font-bold text-white">{card.car_horsepower || '?'}</span>
                <span className="text-dark-500 text-xs ml-1">HP</span>
              </div>
              <div className="text-center">
                <Gauge className="w-4 h-4 text-blue-500 mx-auto" />
                <span className="font-bold text-white">{card.car_torque || '?'}</span>
                <span className="text-dark-500 text-xs ml-1">Nm</span>
              </div>
              <div className="text-center">
                <Timer className="w-4 h-4 text-red-500 mx-auto" />
                <span className="font-bold text-white">{card.car_max_speed || '?'}</span>
                <span className="text-dark-500 text-xs ml-1">km/h</span>
              </div>
            </div>
          )}
        </div>
      </button>
    );
  }

  // === GRID VARIANT (miniaturka w siatce 2 kolumny) ===
  return (
    <button
      onClick={onClick}
      className={`relative text-left transition-all duration-300 group ${
        owned ? 'hover:scale-[1.03]' : 'opacity-75 hover:opacity-100'
      }`}
    >
      <div className={`relative rounded-xl border-3 overflow-hidden ${effects.frameClass} ${effects.cardClass} ${
        owned ? 'shadow-xl' : ''
      }`} style={{ borderWidth: '3px' }}>
        {/* Iskierki dla legendary */}
        {sparklePositions.map((pos, i) => (
          <div
            key={i}
            className="sparkle-particle"
            style={{ ...pos, animationDelay: pos.delay }}
          />
        ))}

        {/* Zdjęcie - proporcje 4:3 */}
        <div className="aspect-[4/3] relative speed-lines">
          {card.image_url ? (
            <img
              src={card.image_url}
              alt={card.name}
              className={`w-full h-full object-cover transition-all duration-500 ${
                !owned && !isDemoMode ? 'grayscale brightness-50' : ''
              } ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
              onLoad={() => setImageLoaded(true)}
            />
          ) : (
            <div className={`w-full h-full ${config.bgColor} flex items-center justify-center`}>
              <Car className={`w-12 h-12 ${config.color}`} />
            </div>
          )}

          {/* Lock overlay */}
          {!owned && !isDemoMode && (
            <div className="absolute inset-0 bg-dark-900/50 flex items-center justify-center">
              <Lock className="w-8 h-8 text-dark-400" />
            </div>
          )}

          {/* Oczekuje na płatność */}
          {pendingOrder && (
            <div className="absolute top-2 left-2 flex items-center gap-1 px-2 py-1 rounded-full bg-yellow-500/90 text-xs font-medium text-dark-900">
              <Clock className="w-3 h-3" />
              Oczekuje
            </div>
          )}

          {/* Posiadana */}
          {owned && (
            <div className="absolute top-2 left-2">
              <CheckCircle className="w-6 h-6 text-green-500 drop-shadow-lg" />
            </div>
          )}

          {/* Ilość duplikatów */}
          {count > 1 && (
            <div className="absolute top-2 left-2 w-6 h-6 rounded-full bg-turbo-500 text-white text-xs font-bold flex items-center justify-center">
              x{count}
            </div>
          )}

          {/* Cena (jeśli do kupienia) */}
          {card.is_purchasable && card.price && !owned && (
            <div className="absolute bottom-2 left-2 px-2 py-1 rounded-lg bg-gradient-to-r from-turbo-500 to-purple-500 text-white text-xs font-bold shadow-lg">
              {card.price} zł
            </div>
          )}

          {/* Gradient overlay na dole - zawsze widoczny dla efektu */}
          <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-dark-900 to-transparent" />
        </div>

        {/* Info pod zdjęciem z mini-statsami */}
        <div className="p-2.5 bg-dark-800">
          {/* Nazwa i marka */}
          <h3 className={`font-bold text-sm truncate ${owned ? 'text-white' : 'text-dark-300'}`}>
            {card.car_model || card.name}
          </h3>
          <div className="flex items-center justify-between mt-0.5">
            <span className="text-xs text-dark-500">{card.car_brand}</span>
            {card.car_year && (
              <span className="text-xs text-dark-600">{card.car_year}</span>
            )}
          </div>

          {/* Mini stats bar - tylko dla rare+ */}
          {effects.statsVisible && (
            <div className="mt-2 pt-2 border-t border-dark-700 space-y-1">
              {/* HP bar */}
              <div className="flex items-center gap-2">
                <Zap className="w-3 h-3 text-yellow-500" />
                <div className="flex-1 h-1.5 bg-dark-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full stat-bar-fill"
                    style={{ '--stat-value': `${hpPercent}%` } as React.CSSProperties}
                  />
                </div>
                <span className="text-xs text-dark-400 w-12 text-right">{card.car_horsepower}</span>
              </div>

              {/* Torque bar */}
              <div className="flex items-center gap-2">
                <Gauge className="w-3 h-3 text-blue-500" />
                <div className="flex-1 h-1.5 bg-dark-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full stat-bar-fill"
                    style={{ '--stat-value': `${torquePercent}%`, animationDelay: '0.1s' } as React.CSSProperties}
                  />
                </div>
                <span className="text-xs text-dark-400 w-12 text-right">{card.car_torque}</span>
              </div>

              {/* Speed bar */}
              <div className="flex items-center gap-2">
                <Timer className="w-3 h-3 text-red-500" />
                <div className="flex-1 h-1.5 bg-dark-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-red-500 to-pink-500 rounded-full stat-bar-fill"
                    style={{ '--stat-value': `${speedPercent}%`, animationDelay: '0.2s' } as React.CSSProperties}
                  />
                </div>
                <span className="text-xs text-dark-400 w-12 text-right">{card.car_max_speed}</span>
              </div>
            </div>
          )}

        </div>
      </div>
    </button>
  );
}

export default CollectibleCardDisplay;
