'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useCards } from '@/hooks/useCards';
import { useTuning } from '@/hooks/useTuning';
import { useToast } from '@/components/ui/Toast';
import { Card, Badge, Button, Modal, Avatar } from '@/components/ui';
import { CollectibleCard, TunedCar, TuningCategory, TuningChallenge } from '@/types';
import {
  MOD_DEFINITIONS,
  CATEGORY_LABELS,
  CATEGORY_WEIGHTS,
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
  Swords,
  History,
  Car,
  Trophy,
  X,
  ArrowRight,
  Crown,
  Minus,
} from 'lucide-react';

type Tab = 'garage' | 'challenges' | 'history';

export default function TuningPage() {
  const { profile } = useAuth();
  const { userCards, allCards } = useCards({ userId: profile?.id });
  const {
    tunedCars,
    openChallenges,
    myBattles,
    availableXP,
    totalXP,
    loading,
    addCarToTuning,
    removeCarFromTuning,
    upgradeMod,
    calculateScore,
    postChallenge,
    cancelChallenge,
    acceptChallenge,
    fetchMyChallenges,
    refresh,
  } = useTuning({ userId: profile?.id });
  const { success, error: toastError } = useToast();

  const [tab, setTab] = useState<Tab>('garage');
  const [selectedTunedCar, setSelectedTunedCar] = useState<TunedCar | null>(null);
  const [showAddCarModal, setShowAddCarModal] = useState(false);
  const [showModifyModal, setShowModifyModal] = useState(false);
  const [showPostChallengeModal, setShowPostChallengeModal] = useState(false);
  const [showAcceptModal, setShowAcceptModal] = useState(false);
  const [showResultModal, setShowResultModal] = useState(false);
  const [selectedChallenge, setSelectedChallenge] = useState<TuningChallenge | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<TuningCategory>('drag');
  const [selectedAcceptCar, setSelectedAcceptCar] = useState<TunedCar | null>(null);
  const [myChallenges, setMyChallenges] = useState<TuningChallenge[]>([]);
  const [battleResult, setBattleResult] = useState<{
    challengerScore: number;
    opponentScore: number;
    winnerId: string | null;
    challengerCar: TunedCar;
    opponentCar: TunedCar;
    category: TuningCategory;
  } | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [challengeRefresh, setChallengeRefresh] = useState(0);

  const refreshMyChallenges = () => setChallengeRefresh(c => c + 1);

  useEffect(() => {
    if (profile?.id) {
      fetchMyChallenges().then(setMyChallenges);
    }
  }, [profile?.id, fetchMyChallenges, openChallenges, challengeRefresh]);

  if (!profile) return null;

  // Karty samochodow gracza, ktore nie sa jeszcze w tuningu
  const tunedCardIds = new Set(tunedCars.map(tc => tc.card_id));
  const availableCarCards = allCards
    .filter(c => c.card_type === 'car')
    .filter(c => userCards.some(uc => uc.card_id === c.id))
    .filter(c => !tunedCardIds.has(c.id));

  const investedXP = totalXP - availableXP;

  const tabs: { value: Tab; label: string; icon: React.ElementType; count?: number }[] = [
    { value: 'garage', label: 'Moj Garaz', icon: Wrench, count: tunedCars.length },
    { value: 'challenges', label: 'Wyzwania', icon: Swords, count: openChallenges.length },
    { value: 'history', label: 'Historia', icon: History },
  ];

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

  const handlePostChallenge = async () => {
    if (!selectedTunedCar) return;
    setActionLoading(true);
    const result = await postChallenge(selectedTunedCar.id, selectedCategory);
    if (result.success) {
      success('Wyzwanie wystawione!', 'Czekaj az ktos je podejmie');
      setShowPostChallengeModal(false);
      refreshMyChallenges();
    } else {
      toastError('Blad', result.error || 'Nie udalo sie wystawic wyzwania');
    }
    setActionLoading(false);
  };

  const handleCancelChallenge = async (challengeId: string) => {
    setActionLoading(true);
    const result = await cancelChallenge(challengeId);
    if (result.success) {
      success('Anulowano', 'Wyzwanie zostalo anulowane');
      refreshMyChallenges();
    } else {
      toastError('Blad', result.error || 'Nie udalo sie anulowac');
    }
    setActionLoading(false);
  };

  const handleAcceptChallenge = async () => {
    if (!selectedChallenge || !selectedAcceptCar) return;
    setActionLoading(true);
    const result = await acceptChallenge(selectedChallenge.id, selectedAcceptCar.id);
    if (result.success && result.result) {
      setBattleResult(result.result);
      setShowAcceptModal(false);
      setShowResultModal(true);
    } else {
      toastError('Blad', result.error || 'Nie udalo sie przyjac wyzwania');
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
    <div className="py-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Wrench className="w-7 h-7 text-turbo-500" />
          Strefa Tuningu
        </h1>
        <div className="text-right">
          <div className="text-sm text-dark-400">Dostepne XP</div>
          <div className="text-lg font-bold text-turbo-400">
            {availableXP} <span className="text-xs text-dark-500">/ {totalXP}</span>
          </div>
          {investedXP > 0 && (
            <div className="text-xs text-dark-500">Zainwestowane: {investedXP}</div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
        {tabs.map(t => {
          const Icon = t.icon;
          return (
            <button
              key={t.value}
              onClick={() => setTab(t.value)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-colors ${
                tab === t.value
                  ? 'bg-turbo-500 text-white'
                  : 'bg-dark-700 text-dark-300 hover:bg-dark-600'
              }`}
            >
              <Icon className="w-4 h-4" />
              {t.label}
              {t.count !== undefined && t.count > 0 && (
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                  tab === t.value ? 'bg-white/20' : 'bg-dark-600'
                }`}>
                  {t.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* TAB: Moj Garaz */}
      {tab === 'garage' && (
        <div className="space-y-4">
          {/* Moje otwarte wyzwania */}
          {myChallenges.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-dark-400 mb-2">Twoje otwarte wyzwania</h3>
              <div className="space-y-2">
                {myChallenges.map(ch => (
                  <Card key={ch.id} className="border-orange-500/30">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-sm text-white">
                          {CATEGORY_LABELS[ch.category as TuningCategory]?.name}
                        </span>
                        <span className="text-xs text-dark-500 ml-2">Oczekuje na przeciwnika</span>
                      </div>
                      <button
                        onClick={() => handleCancelChallenge(ch.id)}
                        className="text-xs text-red-400 hover:text-red-300 px-2 py-1"
                        disabled={actionLoading}
                      >
                        Anuluj
                      </button>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Lista tuningowanych aut */}
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <Card key={i} className="h-32 animate-pulse bg-dark-700" />
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
                      <div className="w-20 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-dark-700">
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

                      {/* Akcje */}
                      <div className="flex flex-col gap-1 flex-shrink-0">
                        <button
                          onClick={() => {
                            setSelectedTunedCar(tc);
                            setShowModifyModal(true);
                          }}
                          className="px-3 py-1.5 text-xs font-medium bg-turbo-500/20 text-turbo-400 rounded-lg hover:bg-turbo-500/30"
                        >
                          Mody
                        </button>
                        <button
                          onClick={() => {
                            setSelectedTunedCar(tc);
                            setShowPostChallengeModal(true);
                          }}
                          className="px-3 py-1.5 text-xs font-medium bg-orange-500/20 text-orange-400 rounded-lg hover:bg-orange-500/30"
                        >
                          Walcz
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
        </div>
      )}

      {/* TAB: Wyzwania */}
      {tab === 'challenges' && (
        <div className="space-y-4">
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <Card key={i} className="h-20 animate-pulse bg-dark-700" />
              ))}
            </div>
          ) : (
            <>
              {/* Moje otwarte wyzwania */}
              {myChallenges.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-dark-400 mb-2">Twoje wyzwania</h3>
                  <div className="space-y-2">
                    {myChallenges.map(ch => (
                      <Card key={ch.id} className="border-cyan-500/30">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-cyan-500/20 flex items-center justify-center flex-shrink-0">
                            <Swords className="w-4 h-4 text-cyan-400" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-white">
                                {CATEGORY_LABELS[ch.category as TuningCategory]?.icon}{' '}
                                {CATEGORY_LABELS[ch.category as TuningCategory]?.name}
                              </span>
                            </div>
                            <span className="text-xs text-dark-500">Oczekuje na przeciwnika...</span>
                          </div>
                          <button
                            onClick={() => handleCancelChallenge(ch.id)}
                            disabled={actionLoading}
                            className="px-3 py-1.5 text-xs font-medium text-red-400 hover:text-red-300 bg-red-500/10 rounded-lg hover:bg-red-500/20 transition-colors"
                          >
                            Anuluj
                          </button>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* Wyzwania od innych graczy */}
              {openChallenges.length > 0 ? (
                <div>
                  {myChallenges.length > 0 && (
                    <h3 className="text-sm font-medium text-dark-400 mb-2">Wyzwania do podjecia</h3>
                  )}
                  <div className="space-y-2">
                    {openChallenges.map(ch => (
                      <Card key={ch.id} className="hover:border-orange-500/50 transition-colors cursor-pointer"
                        onClick={() => {
                          setSelectedChallenge(ch);
                          setSelectedAcceptCar(null);
                          setShowAcceptModal(true);
                        }}
                      >
                        <div className="flex items-center gap-3">
                          <Avatar
                            src={(ch.challenger as unknown as { avatar_url?: string })?.avatar_url}
                            fallback={(ch.challenger as unknown as { nick: string })?.nick || '?'}
                            size="sm"
                          />
                          <div className="flex-1">
                            <h3 className="font-medium text-white text-sm">
                              {(ch.challenger as unknown as { nick: string })?.nick || 'Gracz'}
                            </h3>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-xs px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-400">
                                {CATEGORY_LABELS[ch.category as TuningCategory]?.icon}{' '}
                                {CATEGORY_LABELS[ch.category as TuningCategory]?.name}
                              </span>
                            </div>
                          </div>
                          <Button size="sm" variant="primary">
                            Podejmij
                          </Button>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              ) : myChallenges.length === 0 ? (
                <Card className="text-center py-12">
                  <Swords className="w-12 h-12 text-dark-600 mx-auto mb-3" />
                  <p className="text-dark-400">Brak otwartych wyzwan</p>
                  <p className="text-sm text-dark-500 mt-1">Wystaw wlasne wyzwanie w zakladce Garaz!</p>
                </Card>
              ) : null}
            </>
          )}
        </div>
      )}

      {/* TAB: Historia */}
      {tab === 'history' && (
        <div className="space-y-3">
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <Card key={i} className="h-20 animate-pulse bg-dark-700" />
              ))}
            </div>
          ) : myBattles.length > 0 ? (
            myBattles.map(battle => {
              const isChallenger = battle.challenger_id === profile.id;
              const won = battle.winner_id === profile.id;
              const draw = !battle.winner_id;
              const opponentNick = isChallenger
                ? (battle.opponent as unknown as { nick: string })?.nick || 'Gracz'
                : (battle.challenger as unknown as { nick: string })?.nick || 'Gracz';
              const myScore = isChallenger ? battle.challenger_score : battle.opponent_score;
              const theirScore = isChallenger ? battle.opponent_score : battle.challenger_score;

              return (
                <Card key={battle.id}>
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      won ? 'bg-green-500/20' : draw ? 'bg-yellow-500/20' : 'bg-red-500/20'
                    }`}>
                      {won ? (
                        <Trophy className="w-5 h-5 text-green-500" />
                      ) : draw ? (
                        <Minus className="w-5 h-5 text-yellow-500" />
                      ) : (
                        <X className="w-5 h-5 text-red-500" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className={`text-sm font-medium ${
                          won ? 'text-green-400' : draw ? 'text-yellow-400' : 'text-red-400'
                        }`}>
                          {won ? 'Wygrana' : draw ? 'Remis' : 'Przegrana'}
                        </h3>
                        <span className="text-xs text-dark-500">vs {opponentNick}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5 text-xs text-dark-400">
                        <span>{CATEGORY_LABELS[battle.category as TuningCategory]?.icon} {CATEGORY_LABELS[battle.category as TuningCategory]?.name}</span>
                        <span>{myScore} : {theirScore}</span>
                      </div>
                    </div>
                    {won && (
                      <Badge variant="turbo" className="text-xs">+30 XP</Badge>
                    )}
                  </div>
                </Card>
              );
            })
          ) : (
            <Card className="text-center py-12">
              <History className="w-12 h-12 text-dark-600 mx-auto mb-3" />
              <p className="text-dark-400">Brak historii bitew</p>
              <p className="text-sm text-dark-500 mt-1">Podejmij lub wystaw wyzwanie!</p>
            </Card>
          )}
        </div>
      )}

      {/* === MODAL: Dodaj auto === */}
      <Modal
        isOpen={showAddCarModal}
        onClose={() => setShowAddCarModal(false)}
        title="Dodaj auto do tuningu"
      >
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {availableCarCards.length > 0 ? (
            availableCarCards.map(card => (
              <button
                key={card.id}
                onClick={() => handleAddCar(card)}
                disabled={actionLoading}
                className="w-full flex items-center gap-3 p-3 rounded-xl bg-dark-700 hover:bg-dark-600 transition-colors text-left"
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
              <div className="flex items-center gap-3 p-3 rounded-xl bg-dark-700">
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
                    <div key={mod.id} className="p-3 rounded-xl bg-dark-700">
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

      {/* === MODAL: Wystaw wyzwanie === */}
      <Modal
        isOpen={showPostChallengeModal}
        onClose={() => setShowPostChallengeModal(false)}
        title="Wystaw wyzwanie"
      >
        {selectedTunedCar && selectedTunedCar.card && (
          <div className="space-y-4">
            {/* Wybrane auto */}
            <div className="p-3 rounded-xl bg-dark-700">
              <div className="flex items-center gap-3">
                <Car className="w-5 h-5 text-dark-400" />
                <span className="text-sm text-white font-medium">
                  {selectedTunedCar.card.car_brand} {selectedTunedCar.card.car_model}
                </span>
              </div>
            </div>

            {/* Wybor kategorii */}
            <div>
              <h4 className="text-sm font-medium text-dark-300 mb-2">Wybierz kategorie</h4>
              <div className="grid grid-cols-2 gap-2">
                {(Object.entries(CATEGORY_LABELS) as [TuningCategory, typeof CATEGORY_LABELS[TuningCategory]][]).map(([key, cat]) => {
                  const score = calculateScore(selectedTunedCar, key);
                  return (
                    <button
                      key={key}
                      onClick={() => setSelectedCategory(key)}
                      className={`p-3 rounded-xl text-left transition-colors ${
                        selectedCategory === key
                          ? 'bg-turbo-500/20 border border-turbo-500/50'
                          : 'bg-dark-700 border border-transparent hover:border-dark-600'
                      }`}
                    >
                      <div className="text-lg mb-1">{cat.icon}</div>
                      <div className="text-sm font-medium text-white">{cat.name}</div>
                      <div className="text-xs text-dark-400 mt-0.5">{cat.description}</div>
                      <div className="text-xs text-turbo-400 mt-1 font-medium">Score: {score}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Podglad statow */}
            <div className="p-3 rounded-xl bg-dark-700">
              <h4 className="text-xs text-dark-400 mb-2">Wagi kategorii</h4>
              <div className="flex items-center gap-4 text-xs">
                <span className="flex items-center gap-1">
                  <Zap className="w-3 h-3 text-yellow-500" />
                  x{CATEGORY_WEIGHTS[selectedCategory].hp}
                </span>
                <span className="flex items-center gap-1">
                  <Gauge className="w-3 h-3 text-blue-500" />
                  x{CATEGORY_WEIGHTS[selectedCategory].torque}
                </span>
                <span className="flex items-center gap-1">
                  <Timer className="w-3 h-3 text-red-500" />
                  x{CATEGORY_WEIGHTS[selectedCategory].speed}
                </span>
              </div>
            </div>

            <Button
              variant="primary"
              fullWidth
              onClick={handlePostChallenge}
              disabled={actionLoading}
            >
              <Swords className="w-4 h-4 mr-2" />
              Wystaw wyzwanie
            </Button>
          </div>
        )}
      </Modal>

      {/* === MODAL: Podejmij wyzwanie === */}
      <Modal
        isOpen={showAcceptModal}
        onClose={() => setShowAcceptModal(false)}
        title="Podejmij wyzwanie"
      >
        {selectedChallenge && (
          <div className="space-y-4">
            {/* Info o wyzwaniu */}
            <div className="p-3 rounded-xl bg-dark-700">
              <div className="flex items-center gap-3">
                <Avatar
                  src={(selectedChallenge.challenger as unknown as { avatar_url?: string })?.avatar_url}
                  fallback={(selectedChallenge.challenger as unknown as { nick: string })?.nick || '?'}
                  size="sm"
                />
                <div>
                  <h4 className="text-sm font-medium text-white">
                    {(selectedChallenge.challenger as unknown as { nick: string })?.nick || 'Gracz'}
                  </h4>
                  <span className="text-xs text-orange-400">
                    {CATEGORY_LABELS[selectedChallenge.category as TuningCategory]?.icon}{' '}
                    {CATEGORY_LABELS[selectedChallenge.category as TuningCategory]?.name}
                  </span>
                </div>
              </div>
            </div>

            {/* Wybor swojego auta */}
            <div>
              <h4 className="text-sm font-medium text-dark-300 mb-2">Wybierz swoje auto</h4>
              {tunedCars.length > 0 ? (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {tunedCars.map(tc => {
                    const card = tc.card;
                    if (!card) return null;
                    const score = calculateScore(tc, selectedChallenge.category as TuningCategory);
                    const isSelected = selectedAcceptCar?.id === tc.id;

                    return (
                      <button
                        key={tc.id}
                        onClick={() => setSelectedAcceptCar(tc)}
                        className={`w-full flex items-center gap-3 p-3 rounded-xl text-left transition-colors ${
                          isSelected
                            ? 'bg-turbo-500/20 border border-turbo-500/50'
                            : 'bg-dark-700 border border-transparent hover:border-dark-600'
                        }`}
                      >
                        <div className="w-12 h-9 rounded-lg overflow-hidden flex-shrink-0 bg-dark-800">
                          {card.image_url ? (
                            <img src={card.image_url} alt={card.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Car className="w-4 h-4 text-dark-500" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-medium text-white truncate">
                            {card.car_brand} {card.car_model}
                          </h4>
                        </div>
                        <span className="text-sm font-bold text-turbo-400">{score}</span>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-4 text-dark-400 text-sm">
                  Brak tuningowanych aut. Dodaj auto do tuningu!
                </div>
              )}
            </div>

            <Button
              variant="primary"
              fullWidth
              onClick={handleAcceptChallenge}
              disabled={actionLoading || !selectedAcceptCar}
            >
              <Swords className="w-4 h-4 mr-2" />
              Walcz!
            </Button>
          </div>
        )}
      </Modal>

      {/* === MODAL: Wynik bitwy === */}
      <Modal
        isOpen={showResultModal}
        onClose={() => {
          setShowResultModal(false);
          setBattleResult(null);
        }}
        title="Wynik bitwy"
      >
        {battleResult && (
          <div className="space-y-4 text-center">
            {/* Win/Lose/Draw */}
            <div className={`py-4 rounded-xl ${
              battleResult.winnerId === profile.id
                ? 'bg-green-500/20'
                : !battleResult.winnerId
                  ? 'bg-yellow-500/20'
                  : 'bg-red-500/20'
            }`}>
              {battleResult.winnerId === profile.id ? (
                <>
                  <Crown className="w-12 h-12 text-green-400 mx-auto mb-2" />
                  <h3 className="text-xl font-bold text-green-400">WYGRANA!</h3>
                  <p className="text-sm text-green-300 mt-1">+30 XP</p>
                </>
              ) : !battleResult.winnerId ? (
                <>
                  <Minus className="w-12 h-12 text-yellow-400 mx-auto mb-2" />
                  <h3 className="text-xl font-bold text-yellow-400">REMIS</h3>
                </>
              ) : (
                <>
                  <X className="w-12 h-12 text-red-400 mx-auto mb-2" />
                  <h3 className="text-xl font-bold text-red-400">PRZEGRANA</h3>
                </>
              )}
            </div>

            {/* Kategoria */}
            <div className="text-sm text-dark-400">
              {CATEGORY_LABELS[battleResult.category]?.icon}{' '}
              {CATEGORY_LABELS[battleResult.category]?.name}
            </div>

            {/* Scores */}
            <div className="flex items-center justify-center gap-4">
              <div className="text-center">
                <p className="text-xs text-dark-500 mb-1">Ty</p>
                <div className="text-2xl font-bold text-white">
                  {battleResult.challengerCar.user_id === profile.id
                    ? battleResult.challengerScore
                    : battleResult.opponentScore}
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-dark-600 rotate-0" />
              <div className="text-center">
                <p className="text-xs text-dark-500 mb-1">Przeciwnik</p>
                <div className="text-2xl font-bold text-white">
                  {battleResult.challengerCar.user_id === profile.id
                    ? battleResult.opponentScore
                    : battleResult.challengerScore}
                </div>
              </div>
            </div>

            {/* Szczegoly */}
            <div className="p-3 rounded-xl bg-dark-700 text-xs text-dark-400">
              <div className="flex items-center justify-between">
                <span>Wagi: KM x{CATEGORY_WEIGHTS[battleResult.category].hp}, Nm x{CATEGORY_WEIGHTS[battleResult.category].torque}, km/h x{CATEGORY_WEIGHTS[battleResult.category].speed}</span>
              </div>
            </div>

            <Button
              variant="primary"
              fullWidth
              onClick={() => {
                setShowResultModal(false);
                setBattleResult(null);
              }}
            >
              Zamknij
            </Button>
          </div>
        )}
      </Modal>
    </div>
  );
}
