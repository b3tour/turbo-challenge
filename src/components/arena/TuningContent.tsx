'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useCards } from '@/hooks/useCards';
import { useTuning } from '@/hooks/useTuning';
import { useToast } from '@/components/ui/Toast';
import { Card, Button, Modal } from '@/components/ui';
import { SkeletonCard } from '@/components/ui/Skeleton';
import { CollectibleCard, TunedCar, TuningCategory } from '@/types';
import {
  MOD_DEFINITIONS,
  CATEGORY_WEIGHTS,
  CATEGORY_LABELS,
  getCumulativeBonus,
  getUpgradeCost,
} from '@/config/tuningConfig';
import {
  Wrench,
  Plus,
  Trash2,
  Zap,
  Gauge,
  Timer,
  ChevronUp,
  Car,
  Trophy,
  Flame,
  Mountain,
  Flag,
  Clock,
  Coins,
  CircleGauge,
} from 'lucide-react';

const CATEGORY_ICONS: Record<TuningCategory, React.ElementType> = {
  drag: Flame,
  hill_climb: Mountain,
  track: Flag,
  time_attack: Clock,
};

const CATEGORY_COLORS: Record<TuningCategory, { text: string; bg: string; bar: string }> = {
  drag: { text: 'text-orange-400', bg: 'bg-orange-500/20', bar: 'bg-orange-500' },
  hill_climb: { text: 'text-emerald-400', bg: 'bg-emerald-500/20', bar: 'bg-emerald-500' },
  track: { text: 'text-cyan-400', bg: 'bg-cyan-500/20', bar: 'bg-cyan-500' },
  time_attack: { text: 'text-violet-400', bg: 'bg-violet-500/20', bar: 'bg-violet-500' },
};

export function TuningContent() {
  const { profile } = useAuth();
  const { userCards, allCards } = useCards({ userId: profile?.id });
  const {
    tunedCars,
    availableXP,
    totalXP,
    loading,
    addCarToTuning,
    removeCarFromTuning,
    upgradeMod,
    calculateScore,
  } = useTuning({ userId: profile?.id });
  const { success, error: toastError } = useToast();

  const [selectedTunedCar, setSelectedTunedCar] = useState<TunedCar | null>(null);
  const [showAddCarModal, setShowAddCarModal] = useState(false);
  const [showModifyModal, setShowModifyModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  if (!profile) return null;

  // Karty samochodow gracza, ktore nie sa jeszcze w tuningu (max 550 KM bazowej mocy)
  const MAX_TUNING_HP = 550;
  const tunedCardIds = new Set(tunedCars.map(tc => tc.card_id));
  const availableCarCards = allCards
    .filter(c => c.card_type === 'car')
    .filter(c => userCards.some(uc => uc.card_id === c.id))
    .filter(c => !tunedCardIds.has(c.id))
    .filter(c => !c.car_horsepower || c.car_horsepower <= MAX_TUNING_HP);

  const investedXP = totalXP - availableXP;

  // Stats bar data
  const totalMods = tunedCars.reduce(
    (sum, tc) => sum + tc.engine_stage + tc.turbo_stage + tc.weight_stage,
    0
  );
  const maxMods = tunedCars.length * 9;
  const xpPct = totalXP > 0 ? (availableXP / totalXP) * 100 : 0;
  const modsPct = maxMods > 0 ? (totalMods / maxMods) * 100 : 0;

  // === HANDLERS ===

  const handleAddCar = async (card: CollectibleCard) => {
    setActionLoading(true);
    const result = await addCarToTuning(card.id);
    if (result.success) {
      success('Dodano do tuningu', `${card.car_brand} ${card.car_model} jest gotowe do modyfikacji!`);
      setShowAddCarModal(false);
    } else {
      toastError('Blad', result.error || 'Nie udalo sie dodac auta');
    }
    setActionLoading(false);
  };

  const handleRemoveCar = async (tunedCar: TunedCar) => {
    setActionLoading(true);
    const result = await removeCarFromTuning(tunedCar.id);
    if (result.success) {
      success('Usunieto z tuningu', `XP zostalo zwrocone (${tunedCar.xp_invested} XP)`);
    } else {
      toastError('Blad', result.error || 'Nie udalo sie usunac');
    }
    setActionLoading(false);
  };

  const handleUpgrade = async (tunedCarId: string, modType: 'engine' | 'turbo' | 'weight') => {
    setActionLoading(true);
    const result = await upgradeMod(tunedCarId, modType);
    if (result.success) {
      // Odswiez dane auta w modalu
      const updated = tunedCars.find(tc => tc.id === tunedCarId);
      if (updated) setSelectedTunedCar({ ...updated });
      success('Ulepszono!', 'Mod zostal ulepszony');
    } else {
      toastError('Blad', result.error || 'Nie udalo sie ulepszyc');
    }
    setActionLoading(false);
  };

  // === STAT ICONS ===
  const statIcon = (stat: string, className: string = 'w-4 h-4') => {
    switch (stat) {
      case 'horsepower': return <Zap className={`${className} text-yellow-500`} />;
      case 'torque': return <Gauge className={`${className} text-blue-500`} />;
      case 'speed': return <Timer className={`${className} text-red-500`} />;
      default: return null;
    }
  };

  // === RENDER ===
  return (
    <div className="py-4 space-y-4">
      {/* Stats bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {/* Garaz */}
        <div className="bg-surface-2 rounded-xl p-3">
          <div className="flex items-center gap-1.5 mb-1">
            <Car className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-[11px] text-dark-400">Garaz</span>
          </div>
          <div className="text-lg font-bold text-white leading-tight">
            {tunedCars.length}
            <span className="text-sm font-normal text-dark-500 ml-1">
              {tunedCars.length === 1 ? 'auto' : 'aut'}
            </span>
          </div>
          <div className="text-[10px] text-dark-500 mt-2.5">
            {availableCarCards.length} dostepnych
          </div>
        </div>

        {/* Mody */}
        <div className="bg-surface-2 rounded-xl p-3">
          <div className="flex items-center gap-1.5 mb-1">
            <CircleGauge className="w-3.5 h-3.5 text-green-400" />
            <span className="text-[11px] text-dark-400">Mody</span>
          </div>
          <div className="text-lg font-bold text-white leading-tight">
            {totalMods}
            <span className="text-sm font-normal text-dark-500">/{maxMods}</span>
          </div>
          <div className="mt-1.5 h-1 bg-white/5 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-green-500 transition-all duration-500"
              style={{ width: `${Math.min(modsPct, 100)}%` }}
            />
          </div>
          <div className="text-[10px] text-dark-500 mt-0.5">ulepszen zainstalowanych</div>
        </div>

        {/* Zainwestowane XP */}
        <div className="bg-surface-2 rounded-xl p-3">
          <div className="flex items-center gap-1.5 mb-1">
            <Coins className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-[11px] text-dark-400">Zainwestowane</span>
          </div>
          <div className="text-lg font-bold text-white leading-tight">{investedXP}</div>
          <div className="mt-1.5 h-1 bg-white/5 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-amber-500 transition-all duration-500"
              style={{ width: `${totalXP > 0 ? Math.min((investedXP / totalXP) * 100, 100) : 0}%` }}
            />
          </div>
          <div className="text-[10px] text-dark-500 mt-0.5">XP w modach</div>
        </div>

        {/* Dostepne XP */}
        <div className="bg-surface-2 rounded-xl p-3">
          <div className="flex items-center gap-1.5 mb-1">
            <Zap className="w-3.5 h-3.5 text-turbo-400" />
            <span className="text-[11px] text-dark-400">Dostepne XP</span>
          </div>
          <div className="text-lg font-bold text-white leading-tight">{availableXP}</div>
          <div className="mt-1.5 h-1 bg-white/5 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-turbo-500 transition-all duration-500"
              style={{ width: `${Math.min(xpPct, 100)}%` }}
            />
          </div>
          <div className="text-[10px] text-dark-500 mt-0.5">z {totalXP} total</div>
        </div>
      </div>

      {/* Garage — lista tuningowanych aut */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : tunedCars.length > 0 ? (
        <div className="space-y-3">
          {tunedCars.map(tc => {
            const card = tc.card;
            if (!card) return null;
            return (
              <Card key={tc.id} className="hover:border-dark-600 transition-colors">
                <div className="flex gap-3">
                  {/* Miniaturka */}
                  <div className="w-20 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-surface-2">
                    {card.image_url ? (
                      <img src={card.image_url} alt={card.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Car className="w-8 h-8 text-dark-500" />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-white text-sm truncate">
                      {card.car_brand} {card.car_model}
                    </h3>
                    <div className="flex items-center gap-3 mt-1 text-xs text-dark-400">
                      <span className="flex items-center gap-1">
                        <Zap className="w-3 h-3 text-yellow-500" />
                        {(card.car_horsepower || 0) + getCumulativeBonus(MOD_DEFINITIONS[0], tc.engine_stage)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Gauge className="w-3 h-3 text-blue-500" />
                        {(card.car_torque || 0) + getCumulativeBonus(MOD_DEFINITIONS[1], tc.turbo_stage)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Timer className="w-3 h-3 text-red-500" />
                        {(card.car_max_speed || 0) + getCumulativeBonus(MOD_DEFINITIONS[2], tc.weight_stage)}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 mt-1">
                      {[tc.engine_stage, tc.turbo_stage, tc.weight_stage].map((stage, idx) => (
                        <div key={idx} className="flex gap-0.5">
                          {[1, 2, 3].map(s => (
                            <div
                              key={s}
                              className={`w-1.5 h-1.5 rounded-full ${
                                s <= stage ? 'bg-turbo-500' : 'bg-dark-600'
                              }`}
                            />
                          ))}
                          {idx < 2 && <div className="w-1" />}
                        </div>
                      ))}
                      <span className="text-[10px] text-dark-500 ml-1">{tc.xp_invested} XP</span>
                    </div>
                  </div>

                  {/* Akcje — tylko Mody */}
                  <div className="flex flex-col gap-1 flex-shrink-0 justify-center">
                    <button
                      onClick={() => {
                        setSelectedTunedCar(tc);
                        setShowModifyModal(true);
                      }}
                      className="px-3 py-1.5 text-xs font-medium bg-turbo-500/20 text-turbo-400 rounded-lg hover:bg-turbo-500/30"
                    >
                      Mody
                    </button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="text-center py-12">
          <Car className="w-12 h-12 text-dark-600 mx-auto mb-3" />
          <p className="text-dark-400">Brak aut w tuningu</p>
          <p className="text-sm text-dark-500 mt-1">Dodaj auto z kolekcji aby zaczac!</p>
        </Card>
      )}

      {/* Przycisk dodawania */}
      <button
        onClick={() => setShowAddCarModal(true)}
        className="w-full py-3 border-2 border-dashed border-dark-600 rounded-xl text-dark-400 hover:border-turbo-500/50 hover:text-turbo-400 transition-colors flex items-center justify-center gap-2"
      >
        <Plus className="w-5 h-5" />
        Dodaj auto do tuningu
      </button>

      {/* === MODAL: Dodaj auto === */}
      <Modal
        isOpen={showAddCarModal}
        onClose={() => setShowAddCarModal(false)}
        title="Dodaj auto do tuningu"
      >
        <div className="space-y-3 max-h-96 overflow-y-auto">
          <p className="text-xs text-dark-400 px-1">
            Tuningowac mozna auta do {MAX_TUNING_HP} KM bazowej mocy.
          </p>
          {availableCarCards.length > 0 ? (
            availableCarCards.map(card => (
              <button
                key={card.id}
                onClick={() => handleAddCar(card)}
                disabled={actionLoading}
                className="w-full flex items-center gap-3 p-3 rounded-xl bg-surface-2 hover:bg-dark-600 transition-colors text-left"
              >
                <div className="w-16 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-dark-800">
                  {card.image_url ? (
                    <img src={card.image_url} alt={card.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Car className="w-6 h-6 text-dark-500" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-medium text-white truncate">
                    {card.car_brand} {card.car_model}
                  </h4>
                  <div className="flex items-center gap-2 text-xs text-dark-400 mt-0.5">
                    <span>{card.car_horsepower} KM</span>
                    <span>{card.car_torque} Nm</span>
                    <span>{card.car_max_speed} km/h</span>
                  </div>
                </div>
                <Plus className="w-5 h-5 text-turbo-400 flex-shrink-0" />
              </button>
            ))
          ) : (
            <div className="text-center py-8">
              <Car className="w-10 h-10 text-dark-600 mx-auto mb-2" />
              <p className="text-dark-400 text-sm">Brak dostepnych aut</p>
              <p className="text-dark-500 text-xs mt-1">Wszystkie Twoje samochody sa juz w tuningu lub nie posiadasz kart samochodow</p>
            </div>
          )}
        </div>
      </Modal>

      {/* === MODAL: Modyfikuj auto === */}
      <Modal
        isOpen={showModifyModal}
        onClose={() => setShowModifyModal(false)}
        title="Modyfikuj auto"
      >
        {selectedTunedCar && selectedTunedCar.card && (() => {
          // Pobierz najnowsze dane
          const tc = tunedCars.find(t => t.id === selectedTunedCar.id) || selectedTunedCar;
          const card = tc.card!;
          return (
            <div className="space-y-4">
              {/* Auto info */}
              <div className="flex items-center gap-3 p-3 rounded-xl bg-surface-2">
                <div className="w-16 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-dark-800">
                  {card.image_url ? (
                    <img src={card.image_url} alt={card.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Car className="w-6 h-6 text-dark-500" />
                    </div>
                  )}
                </div>
                <div>
                  <h4 className="font-medium text-white text-sm">{card.car_brand} {card.car_model}</h4>
                  <p className="text-xs text-dark-500">Zainwestowane: {tc.xp_invested} XP</p>
                </div>
              </div>

              {/* Dostepne XP */}
              <div className="flex items-center justify-between text-sm">
                <span className="text-dark-400">Dostepne XP</span>
                <span className="font-bold text-turbo-400">{availableXP}</span>
              </div>

              {/* Mody */}
              <div className="space-y-3">
                {MOD_DEFINITIONS.map(mod => {
                  const stageField = `${mod.id}_stage` as 'engine_stage' | 'turbo_stage' | 'weight_stage';
                  const currentStage = tc[stageField];
                  const upgradeCost = getUpgradeCost(mod, currentStage);
                  const currentBonus = getCumulativeBonus(mod, currentStage);
                  const baseStat = mod.stat === 'horsepower' ? card.car_horsepower
                    : mod.stat === 'torque' ? card.car_torque
                    : card.car_max_speed;

                  return (
                    <div key={mod.id} className="p-3 rounded-xl bg-surface-2">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {statIcon(mod.stat)}
                          <span className="text-sm font-medium text-white">{mod.name}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          {[1, 2, 3].map(s => (
                            <div
                              key={s}
                              className={`w-3 h-3 rounded-full ${
                                s <= currentStage ? 'bg-turbo-500' : 'bg-dark-600'
                              }`}
                            />
                          ))}
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-xs mb-2">
                        <span className="text-dark-400">
                          {baseStat || 0} {currentBonus > 0 && (
                            <span className="text-green-400">+{currentBonus}</span>
                          )} {mod.unit}
                        </span>
                        <span className="text-dark-500 font-medium">
                          = {(baseStat || 0) + currentBonus} {mod.unit}
                        </span>
                      </div>

                      {upgradeCost !== null ? (
                        <button
                          onClick={() => handleUpgrade(tc.id, mod.id)}
                          disabled={actionLoading || availableXP < upgradeCost}
                          className={`w-full flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-medium transition-colors ${
                            availableXP >= upgradeCost
                              ? 'bg-turbo-500/20 text-turbo-400 hover:bg-turbo-500/30'
                              : 'bg-dark-600 text-dark-500 cursor-not-allowed'
                          }`}
                        >
                          <ChevronUp className="w-3 h-3" />
                          Stage {currentStage + 1} — {upgradeCost} XP
                        </button>
                      ) : (
                        <div className="w-full text-center py-2 rounded-lg bg-green-500/20 text-green-400 text-xs font-medium">
                          MAX
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Sila w kategoriach */}
              {(() => {
                const hpTotal = (card.car_horsepower || 0) + getCumulativeBonus(MOD_DEFINITIONS[0], tc.engine_stage);
                const torqueTotal = (card.car_torque || 0) + getCumulativeBonus(MOD_DEFINITIONS[1], tc.turbo_stage);
                const speedTotal = (card.car_max_speed || 0) + getCumulativeBonus(MOD_DEFINITIONS[2], tc.weight_stage);
                const maxPossible = (hpTotal + torqueTotal + speedTotal) * 1.5;
                const categories: TuningCategory[] = ['drag', 'hill_climb', 'track', 'time_attack'];
                const scores = categories.map(cat => ({ cat, score: calculateScore(tc, cat) }));
                const bestCat = scores.reduce((a, b) => b.score > a.score ? b : a).cat;

                return (
                  <div className="p-3 rounded-xl bg-surface-2">
                    <div className="flex items-center gap-2 mb-2.5">
                      <Trophy className="w-4 h-4 text-amber-400" />
                      <span className="text-sm font-medium text-white">Sila w kategoriach</span>
                    </div>
                    <div className="space-y-2">
                      {scores.map(({ cat, score }) => {
                        const pct = maxPossible > 0 ? (score / maxPossible) * 100 : 0;
                        const catConfig = CATEGORY_COLORS[cat];
                        const CatIcon = CATEGORY_ICONS[cat];
                        const isBest = cat === bestCat;
                        return (
                          <div key={cat} className="flex items-center gap-2">
                            <div className={`p-1 rounded-md ${catConfig.bg} flex-shrink-0`}>
                              <CatIcon className={`w-3 h-3 ${catConfig.text}`} />
                            </div>
                            <span className={`text-[10px] w-16 truncate ${isBest ? 'text-white font-medium' : 'text-dark-400'}`}>
                              {CATEGORY_LABELS[cat].name}
                            </span>
                            <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all duration-500 ${catConfig.bar}`}
                                style={{ width: `${Math.min(pct, 100)}%` }}
                              />
                            </div>
                            <span className={`text-[10px] w-8 text-right tabular-nums ${isBest ? 'text-white font-semibold' : 'text-dark-400'}`}>
                              {score}
                            </span>
                            {isBest && <Trophy className="w-3 h-3 text-amber-400 flex-shrink-0" />}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}

              {/* Usun z tuningu */}
              <button
                onClick={async () => {
                  await handleRemoveCar(tc);
                  setShowModifyModal(false);
                }}
                disabled={actionLoading}
                className="w-full flex items-center justify-center gap-2 py-2 text-red-400 hover:text-red-300 text-sm"
              >
                <Trash2 className="w-4 h-4" />
                Usun z tuningu (zwrot {tc.xp_invested} XP)
              </button>
            </div>
          );
        })()}
      </Modal>
    </div>
  );
}
