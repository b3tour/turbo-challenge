'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useBattles, getCategoryName, getCategoryIcon } from '@/hooks/useBattles';
import { useTuning } from '@/hooks/useTuning';
import { Card, Button, Avatar, Badge, Modal } from '@/components/ui';
import { SkeletonCard } from '@/components/ui/Skeleton';
import { useToast } from '@/components/ui/Toast';
import {
  Swords,
  Trophy,
  Users,
  ChevronRight,
  Clock,
  Check,
  X,
  Crown,
  Minus,
  Shuffle,
  ArrowRight,
  History,
  Car,
  Zap,
  Gauge,
  Timer,
  Info,
  Sparkles,
} from 'lucide-react';
import Link from 'next/link';
import { CollectibleCard, BattleSlotAssignment, BattleRoundCategory, BattleRoundResult, User, TunedCar, TuningCategory, TuningChallenge } from '@/types';
import {
  CATEGORY_LABELS,
  CATEGORY_WEIGHTS,
  MOD_DEFINITIONS,
  getCumulativeBonus,
} from '@/config/tuningConfig';

type Tab = 'battles' | 'tuning_challenges' | 'history';

// Kroki tworzenia wyzwania (card battle)
type ChallengeStep = 'select_opponent' | 'dealing' | 'assign_slots' | 'confirm';

// Kroki akceptowania wyzwania (card battle)
type AcceptStep = 'dealing' | 'assign_slots' | 'revealing' | 'done';

// Combined history item
type HistoryItem =
  | { type: 'card_battle'; data: any; date: string }
  | { type: 'tuning_challenge'; data: TuningChallenge; date: string };

interface BattlesContentProps {
  activeSubTab?: 'battles' | 'challenges' | 'history';
}

export function BattlesContent({ activeSubTab }: BattlesContentProps = {}) {
  const { profile } = useAuth();
  const {
    myBattles: cardBattles,
    incomingChallenges,
    loading: battlesLoading,
    createChallenge,
    acceptChallenge: acceptCardChallenge,
    declineChallenge,
    getChallengablePlayers,
    dealRandomCards,
    getChallengesSentThisWeek,
  } = useBattles({ userId: profile?.id });

  const {
    tunedCars,
    openChallenges: tuningOpenChallenges,
    myChallenges,
    myBattles: tuningBattles,
    loading: tuningLoading,
    calculateScore,
    postChallenge: postTuningChallenge,
    cancelChallenge: cancelTuningChallenge,
    acceptChallenge: acceptTuningChallenge,
  } = useTuning({ userId: profile?.id });

  const { success, error: showError } = useToast();

  const [internalTab, setInternalTab] = useState<Tab>('battles');

  // Mapowanie external prop -> internal tab
  const externalTabMap: Record<string, Tab> = {
    battles: 'battles',
    challenges: 'tuning_challenges',
    history: 'history',
  };
  const activeTab: Tab = activeSubTab ? (externalTabMap[activeSubTab] || 'battles') : internalTab;
  const setActiveTab = setInternalTab;
  const [challengesSentThisWeek, setChallengesSentThisWeek] = useState(0);

  // ========== CARD BATTLE STATE ==========
  const [showNewChallengeModal, setShowNewChallengeModal] = useState(false);
  const [challengeStep, setChallengeStep] = useState<ChallengeStep>('select_opponent');
  const [availablePlayers, setAvailablePlayers] = useState<User[]>([]);
  const [selectedOpponent, setSelectedOpponent] = useState<User | null>(null);
  const [dealtCards, setDealtCards] = useState<CollectibleCard[]>([]);
  const [slotAssignment, setSlotAssignment] = useState<Partial<BattleSlotAssignment>>({});
  const [selectedCardForSlot, setSelectedCardForSlot] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Accept card challenge state
  const [showAcceptModal, setShowAcceptModal] = useState(false);
  const [acceptStep, setAcceptStep] = useState<AcceptStep>('dealing');
  const [selectedBattleId, setSelectedBattleId] = useState<string | null>(null);
  const [acceptDealtCards, setAcceptDealtCards] = useState<CollectibleCard[]>([]);
  const [acceptSlotAssignment, setAcceptSlotAssignment] = useState<Partial<BattleSlotAssignment>>({});
  const [acceptSelectedCard, setAcceptSelectedCard] = useState<string | null>(null);

  // Reveal state (card battle)
  const [revealResults, setRevealResults] = useState<BattleRoundResult[] | null>(null);
  const [revealedRound, setRevealedRound] = useState(0);
  const [revealWinnerId, setRevealWinnerId] = useState<string | null | undefined>(undefined);

  // Detail modal (card battle)
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [detailBattle, setDetailBattle] = useState<typeof cardBattles[0] | null>(null);

  // ========== TUNING CHALLENGE STATE ==========
  const [selectedTunedCar, setSelectedTunedCar] = useState<TunedCar | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<TuningCategory>('drag');
  const [showPostTuningModal, setShowPostTuningModal] = useState(false);
  const [showAcceptTuningModal, setShowAcceptTuningModal] = useState(false);
  const [showTuningResultModal, setShowTuningResultModal] = useState(false);
  const [selectedTuningChallenge, setSelectedTuningChallenge] = useState<TuningChallenge | null>(null);
  const [selectedAcceptCar, setSelectedAcceptCar] = useState<TunedCar | null>(null);
  const [tuningBattleResult, setTuningBattleResult] = useState<{
    challengerScore: number;
    opponentScore: number;
    winnerId: string | null;
    challengerCar: TunedCar;
    opponentCar: TunedCar;
    category: TuningCategory;
  } | null>(null);
  const [tuningActionLoading, setTuningActionLoading] = useState(false);
  const [showTuningDetailModal, setShowTuningDetailModal] = useState(false);
  const [detailTuningBattle, setDetailTuningBattle] = useState<TuningChallenge | null>(null);

  // ========== EFFECTS ==========

  // Load card battle stats
  useEffect(() => {
    if (profile?.id) {
      getChallengesSentThisWeek().then(setChallengesSentThisWeek);
    }
  }, [profile?.id, getChallengesSentThisWeek]);

  // Load players when opening new card challenge modal
  useEffect(() => {
    if (showNewChallengeModal && profile?.id) {
      getChallengablePlayers(20).then(setAvailablePlayers);
    }
  }, [showNewChallengeModal, profile?.id, getChallengablePlayers]);

  // ========== CARD BATTLE HANDLERS ==========

  const handleSelectOpponent = async (opponent: User) => {
    setSelectedOpponent(opponent);
    setChallengeStep('dealing');
    try {
      const cards = await dealRandomCards(profile!.id);
      setDealtCards(cards);
      setTimeout(() => setChallengeStep('assign_slots'), 1500);
    } catch (e: any) {
      showError('Blad', e.message || 'Nie udalo sie wylosowac kart');
      setChallengeStep('select_opponent');
    }
  };

  const handleAssignCardToSlot = (cardId: string, slot: BattleRoundCategory) => {
    setSlotAssignment(prev => {
      const updated = { ...prev };
      for (const key of ['power', 'torque', 'speed'] as BattleRoundCategory[]) {
        if (updated[key] === cardId) {
          delete updated[key];
        }
      }
      updated[slot] = cardId;
      return updated;
    });
    setSelectedCardForSlot(null);
  };

  const handleSendChallenge = async () => {
    if (!selectedOpponent || !slotAssignment.power || !slotAssignment.torque || !slotAssignment.speed) {
      showError('Blad', 'Przydziel karty do wszystkich slotow');
      return;
    }
    setIsSubmitting(true);
    const result = await createChallenge(
      selectedOpponent.id,
      dealtCards,
      slotAssignment as BattleSlotAssignment
    );
    if (result.success) {
      success('Wyzwanie wyslane!', `${selectedOpponent.nick} otrzymal Twoje wyzwanie`);
      closeNewChallengeModal();
      getChallengesSentThisWeek().then(setChallengesSentThisWeek);
    } else {
      showError('Blad', result.error || 'Nie udalo sie wyslac wyzwania');
    }
    setIsSubmitting(false);
  };

  const closeNewChallengeModal = () => {
    setShowNewChallengeModal(false);
    setChallengeStep('select_opponent');
    setSelectedOpponent(null);
    setDealtCards([]);
    setSlotAssignment({});
    setSelectedCardForSlot(null);
  };

  const handleStartAccept = async (battleId: string) => {
    setSelectedBattleId(battleId);
    setAcceptStep('dealing');
    setAcceptDealtCards([]);
    setAcceptSlotAssignment({});
    setAcceptSelectedCard(null);
    setShowAcceptModal(true);
    try {
      const cards = await dealRandomCards(profile!.id);
      setAcceptDealtCards(cards);
      setTimeout(() => setAcceptStep('assign_slots'), 1500);
    } catch (e: any) {
      showError('Blad', e.message || 'Nie udalo sie wylosowac kart');
      setShowAcceptModal(false);
    }
  };

  const handleAcceptAssignCard = (cardId: string, slot: BattleRoundCategory) => {
    setAcceptSlotAssignment(prev => {
      const updated = { ...prev };
      for (const key of ['power', 'torque', 'speed'] as BattleRoundCategory[]) {
        if (updated[key] === cardId) {
          delete updated[key];
        }
      }
      updated[slot] = cardId;
      return updated;
    });
    setAcceptSelectedCard(null);
  };

  const handleFight = async () => {
    if (!selectedBattleId || !acceptSlotAssignment.power || !acceptSlotAssignment.torque || !acceptSlotAssignment.speed) {
      showError('Blad', 'Przydziel karty do wszystkich slotow');
      return;
    }
    setIsSubmitting(true);
    const result = await acceptCardChallenge(
      selectedBattleId,
      acceptDealtCards,
      acceptSlotAssignment as BattleSlotAssignment
    );
    if (result.success && result.results) {
      setRevealResults(result.results);
      setRevealWinnerId(result.winnerId);
      setRevealedRound(0);
      setAcceptStep('revealing');
      setTimeout(() => setRevealedRound(1), 800);
      setTimeout(() => setRevealedRound(2), 1800);
      setTimeout(() => setRevealedRound(3), 2800);
      setTimeout(() => setAcceptStep('done'), 3600);
    } else {
      showError('Blad', result.error || 'Nie udalo sie rozstrzygnac bitwy');
    }
    setIsSubmitting(false);
  };

  const handleDeclineChallenge = async (battleId: string) => {
    const result = await declineChallenge(battleId);
    if (result.success) {
      success('Wyzwanie odrzucone', 'Odmowiles udzialu w bitwie');
    } else {
      showError('Blad', result.error || 'Nie udalo sie odrzucic wyzwania');
    }
  };

  const closeAcceptModal = () => {
    setShowAcceptModal(false);
    setSelectedBattleId(null);
    setAcceptDealtCards([]);
    setAcceptSlotAssignment({});
    setAcceptSelectedCard(null);
    setRevealResults(null);
    setRevealedRound(0);
    setRevealWinnerId(undefined);
    setAcceptStep('dealing');
  };

  // ========== TUNING CHALLENGE HANDLERS ==========

  const handlePostTuningChallenge = async () => {
    if (!selectedTunedCar) return;
    setTuningActionLoading(true);
    const result = await postTuningChallenge(selectedTunedCar.id, selectedCategory);
    if (result.success) {
      success('Wyzwanie wystawione!', 'Czekaj az ktos je podejmie');
      setShowPostTuningModal(false);
    } else {
      showError('Blad', result.error || 'Nie udalo sie wystawic wyzwania');
    }
    setTuningActionLoading(false);
  };

  const handleCancelTuningChallenge = async (challengeId: string) => {
    setTuningActionLoading(true);
    const result = await cancelTuningChallenge(challengeId);
    if (result.success) {
      success('Anulowano', 'Wyzwanie zostalo anulowane');
    } else {
      showError('Blad', result.error || 'Nie udalo sie anulowac');
    }
    setTuningActionLoading(false);
  };

  const handleAcceptTuningChallenge = async () => {
    if (!selectedTuningChallenge || !selectedAcceptCar) return;
    setTuningActionLoading(true);
    const result = await acceptTuningChallenge(selectedTuningChallenge.id, selectedAcceptCar.id);
    if (result.success && result.result) {
      setTuningBattleResult(result.result);
      setShowAcceptTuningModal(false);
      setShowTuningResultModal(true);
    } else {
      showError('Blad', result.error || 'Nie udalo sie przyjac wyzwania');
    }
    setTuningActionLoading(false);
  };

  // ========== HELPERS ==========

  const getUnassignedCards = (cards: CollectibleCard[], assignment: Partial<BattleSlotAssignment>) => {
    const assignedIds = new Set(Object.values(assignment).filter(Boolean));
    return cards.filter(c => !assignedIds.has(c.id));
  };

  const getCardById = (cards: CollectibleCard[], id: string) => cards.find(c => c.id === id);

  if (!profile) return null;

  const loading = battlesLoading || tuningLoading;

  // ========== ACTIVE BATTLES (Bitwy tab) ==========
  // Outgoing pending card battles (I challenged someone, waiting for response)
  const outgoingPendingBattles = cardBattles.filter(
    b => b.status === 'pending' && b.challenger_id === profile.id
  );

  // Total active battles count for badge
  const activeBattlesCount = incomingChallenges.length + outgoingPendingBattles.length;

  // ========== COMBINED HISTORY (only completed/declined) ==========

  const combinedHistory: HistoryItem[] = [
    ...cardBattles
      .filter(b => b.status === 'completed' || b.status === 'declined')
      .map(b => ({
        type: 'card_battle' as const,
        data: b,
        date: b.completed_at || b.created_at,
      })),
    ...tuningBattles.map(b => ({
      type: 'tuning_challenge' as const,
      data: b,
      date: b.completed_at || b.created_at,
    })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // ========== TABS ==========

  const tabs: { value: Tab; label: string; icon: React.ElementType; count?: number }[] = [
    { value: 'battles', label: 'Bitwy', icon: Swords, count: activeBattlesCount || undefined },
    { value: 'tuning_challenges', label: 'Wyzwania', icon: Car, count: tuningOpenChallenges.length || undefined },
    { value: 'history', label: 'Historia', icon: History },
  ];

  // ========== RENDER ==========

  return (
    <div className={activeSubTab ? 'space-y-4' : 'py-4 space-y-4'}>
      {/* Header + Tabs — only when used standalone (no external tab control) */}
      {!activeSubTab && (
        <>
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <Swords className="w-7 h-7 text-turbo-500" />
              Turbo Bitwy
            </h1>
            <div className="text-right">
              <div className="text-sm text-dark-400">Wyzwania w tygodniu</div>
              <div className={`text-lg font-bold ${challengesSentThisWeek >= 30 ? 'text-red-400' : 'text-turbo-400'}`}>
                {challengesSentThisWeek}/30
              </div>
            </div>
          </div>

          <div className="bg-surface-1 rounded-xl p-1 flex gap-1 overflow-x-auto">
            {tabs.map(t => {
              const Icon = t.icon;
              return (
                <button
                  key={t.value}
                  onClick={() => setActiveTab(t.value)}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                    activeTab === t.value
                      ? 'bg-red-500 text-white shadow-sm'
                      : 'bg-transparent text-dark-400 hover:text-dark-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {t.label}
                  {t.count !== undefined && t.count > 0 && (
                    <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                      activeTab === t.value ? 'bg-white/20' : 'bg-dark-600'
                    }`}>
                      {t.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </>
      )}

      {/* Content */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : activeTab === 'battles' ? (
        /* ========== TAB: BITWY (Card Battles) ========== */
        <div className="space-y-4">
          {/* Info */}
          <div className="flex gap-2.5 p-3 rounded-xl bg-dark-700/50 border border-dark-600">
            <Info className="w-4 h-4 text-turbo-400 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-dark-300 leading-relaxed">
              Wybierasz gracza z którym chcesz się zmierzyć.
              System losuje 3 karty z Twojej kolekcji. Przydziel je do kategorii: Moc, Moment i Prędkość.
              Wygrywa karta z wyższą wartością w danej rundzie. Zwycięzca Best-Of-3 zdobywa <span className="text-turbo-400 font-medium">+30 XP</span>.
            </p>
          </div>

          {/* Przychodzace wyzwania (ktos mnie wyzwal) */}
          {incomingChallenges.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-dark-400 mb-2">Do rozegrania</h3>
              <div className="space-y-3">
                {incomingChallenges.map(battle => (
                  <Card key={battle.id} className="border-turbo-500/30">
                    <div className="flex items-center gap-3 mb-3">
                      <Avatar
                        src={battle.challenger?.avatar_url}
                        fallback={battle.challenger?.nick || '?'}
                        size="md"
                      />
                      <div className="flex-1">
                        <p className="font-medium text-white">{battle.challenger?.nick}</p>
                        <p className="text-sm text-turbo-400">
                          Turbo Bitwa: 3 rundy
                        </p>
                      </div>
                      <Badge variant="turbo">
                        Best of 3
                      </Badge>
                    </div>

                    <div className="flex items-center gap-4 mb-3 text-xs text-dark-400">
                      <span className="flex items-center gap-1">⚡ Moc</span>
                      <span className="flex items-center gap-1">🔧 Moment</span>
                      <span className="flex items-center gap-1">💨 Predkosc</span>
                    </div>

                    <div className="flex items-center gap-2 mb-3 text-sm text-dark-400">
                      <Clock className="w-4 h-4" />
                      <span>Wygasa: {new Date(battle.expires_at).toLocaleDateString('pl-PL')}</span>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="secondary"
                        className="flex-1"
                        onClick={() => handleDeclineChallenge(battle.id)}
                      >
                        <X className="w-4 h-4 mr-1" />
                        Odrzuc
                      </Button>
                      <Button
                        className="flex-1"
                        onClick={() => handleStartAccept(battle.id)}
                      >
                        <Check className="w-4 h-4 mr-1" />
                        Akceptuj
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Wyslane wyzwania (ja wyslam komus) */}
          {outgoingPendingBattles.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-dark-400 mb-2">Oczekujace na odpowiedz</h3>
              <div className="space-y-2">
                {outgoingPendingBattles.map(battle => (
                  <Card key={battle.id} className="border-yellow-500/30">
                    <div className="flex items-center gap-3">
                      <Avatar
                        src={battle.opponent?.avatar_url}
                        fallback={battle.opponent?.nick || '?'}
                        size="md"
                      />
                      <div className="flex-1">
                        <p className="font-medium text-white">{battle.opponent?.nick}</p>
                        <p className="text-xs text-dark-500">Oczekuje na odpowiedz...</p>
                      </div>
                      <div className="text-right text-xs text-dark-500">
                        <Clock className="w-3.5 h-3.5 inline mr-1" />
                        {new Date(battle.expires_at).toLocaleDateString('pl-PL')}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Puste stany */}
          {incomingChallenges.length === 0 && outgoingPendingBattles.length === 0 && (
            <Card className="text-center py-12">
              <Swords className="w-12 h-12 text-dark-600 mx-auto mb-3" />
              <p className="text-dark-400 font-medium">Brak aktywnych bitew</p>
              <p className="text-sm text-dark-500 mt-1">
                Wyzwij kogos na pojedynek!
              </p>
            </Card>
          )}

          {/* Wyzwij gracza */}
          <button
            onClick={() => {
              if (challengesSentThisWeek >= 30) {
                showError('Limit', 'Osiagnales limit 30 wyzwan na tydzien');
                return;
              }
              setShowNewChallengeModal(true);
            }}
            className={`w-full py-3 border-2 border-dashed rounded-xl flex items-center justify-center gap-2 transition-colors ${
              challengesSentThisWeek >= 30
                ? 'border-dark-700 text-dark-500 cursor-not-allowed'
                : 'border-dark-600 text-dark-400 hover:border-turbo-500/50 hover:text-turbo-400'
            }`}
          >
            <Users className="w-5 h-5" />
            Wyzwij gracza
          </button>

          {/* Mystery Garage promo */}
          <Link href="/mystery">
            <Card className="border-emerald-500/30 hover:border-emerald-400 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-5 h-5 text-emerald-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-white text-sm">Mystery Garage</h4>
                  <p className="text-xs text-dark-400">Potrzebujesz lepszych kart? Kup losowy pakiet!</p>
                </div>
                <ChevronRight className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              </div>
            </Card>
          </Link>
        </div>
      ) : activeTab === 'tuning_challenges' ? (
        /* ========== TAB: WYZWANIA (Tuning Challenges) ========== */
        <div className="space-y-4">
          {/* Info */}
          <div className="flex gap-2.5 p-3 rounded-xl bg-dark-700/50 border border-dark-600">
            <Info className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-dark-300 leading-relaxed">
              Wybierz auto z wcześniej dodanych do Strefy Tuningu i kategorię (np. Drag Race, Track Day).
              Wystaw wyzwanie i czekaj na przeciwnika.
              Twój wynik to suma statystyk auta pomnożona przez wagi kategorii. Wyższy score zdobywa <span className="text-turbo-400 font-medium">+30 XP</span>.
            </p>
          </div>

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
                        onClick={() => handleCancelTuningChallenge(ch.id)}
                        disabled={tuningActionLoading}
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
          {tuningOpenChallenges.length > 0 ? (
            <div>
              {myChallenges.length > 0 && (
                <h3 className="text-sm font-medium text-dark-400 mb-2">Wyzwania do podjecia</h3>
              )}
              <div className="space-y-2">
                {tuningOpenChallenges.map(ch => (
                  <Card key={ch.id} className="hover:border-orange-500/50 transition-colors cursor-pointer"
                    onClick={() => {
                      setSelectedTuningChallenge(ch);
                      setSelectedAcceptCar(null);
                      setShowAcceptTuningModal(true);
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
              <p className="text-sm text-dark-500 mt-1">Wystaw wlasne wyzwanie ponizej!</p>
            </Card>
          ) : null}

          {/* Wystaw wyzwanie tuningowe */}
          {tunedCars.length > 0 ? (
            <button
              onClick={() => {
                setSelectedTunedCar(null);
                setSelectedCategory('drag');
                setShowPostTuningModal(true);
              }}
              className="w-full py-3 border-2 border-dashed border-dark-600 rounded-xl text-dark-400 hover:border-turbo-500/50 hover:text-turbo-400 transition-colors flex items-center justify-center gap-2"
            >
              <Swords className="w-5 h-5" />
              Wystaw wyzwanie
            </button>
          ) : (
            <Card className="text-center py-4">
              <p className="text-sm text-dark-500">Dodaj auto w Strefie Tuningu aby wystawiac wyzwania</p>
            </Card>
          )}
        </div>
      ) : (
        /* ========== TAB: HISTORIA (Combined) ========== */
        <div className="space-y-3">
          {combinedHistory.length === 0 ? (
            <Card className="text-center py-12">
              <Trophy className="w-12 h-12 text-dark-600 mx-auto mb-3" />
              <p className="text-dark-400 font-medium">Brak historii bitew</p>
              <p className="text-sm text-dark-500 mt-1">
                Wyzwij kogos na pojedynek!
              </p>
            </Card>
          ) : (
            combinedHistory.map(item => {
              if (item.type === 'card_battle') {
                const battle = item.data;
                const isWinner = battle.winner_id === profile.id;
                const isDraw = battle.status === 'completed' && !battle.winner_id;
                const isPending = battle.status === 'pending';
                const isDeclined = battle.status === 'declined';
                const isCompleted = battle.status === 'completed';
                const opponent = battle.challenger_id === profile.id ? battle.opponent : battle.challenger;

                return (
                  <Card
                    key={`cb-${battle.id}`}
                    className={`${
                      isPending ? 'border-yellow-500/30' :
                      isDeclined ? 'border-dark-500/30' :
                      isDraw ? 'border-blue-500/30' :
                      isWinner ? 'border-green-500/30' : 'border-red-500/30'
                    } ${isCompleted ? 'cursor-pointer hover:bg-dark-700/50 transition-colors' : ''}`}
                    onClick={isCompleted ? () => {
                      setDetailBattle(battle);
                      setShowDetailModal(true);
                    } : undefined}
                  >
                    <div className="flex items-center gap-3">
                      <Avatar
                        src={opponent?.avatar_url}
                        fallback={opponent?.nick || '?'}
                        size="md"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-white">{opponent?.nick}</p>
                          {isPending && <Badge variant="warning">Oczekuje</Badge>}
                          {isDeclined && <Badge variant="default">Odrzucone</Badge>}
                          {isDraw && <Badge variant="info">Remis</Badge>}
                          {isCompleted && !isDraw && (
                            <Badge variant={isWinner ? 'success' : 'danger'}>
                              {isWinner ? 'Wygrana' : 'Przegrana'}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-dark-400">
                          <span className="text-xs px-1.5 py-0.5 rounded bg-dark-600 text-dark-300 mr-1">Bitwa</span>
                          Best of 3: ⚡ / 🔧 / 💨
                        </p>
                      </div>
                      {isCompleted && (
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <div className={`font-bold ${isDraw ? 'text-blue-400' : isWinner ? 'text-green-400' : 'text-red-400'}`}>
                              {battle.challenger_id === profile.id ? battle.challenger_score : battle.opponent_score}
                            </div>
                            <div className="text-xs text-dark-500">vs {battle.challenger_id === profile.id ? battle.opponent_score : battle.challenger_score}</div>
                          </div>
                          <ChevronRight className="w-4 h-4 text-dark-500" />
                        </div>
                      )}
                    </div>
                  </Card>
                );
              } else {
                // Tuning challenge
                const battle = item.data;
                const isChallenger = battle.challenger_id === profile.id;
                const won = battle.winner_id === profile.id;
                const draw = !battle.winner_id;
                const opponentNick = isChallenger
                  ? (battle.opponent as unknown as { nick: string })?.nick || 'Gracz'
                  : (battle.challenger as unknown as { nick: string })?.nick || 'Gracz';
                const myScore = isChallenger ? battle.challenger_score : battle.opponent_score;
                const theirScore = isChallenger ? battle.opponent_score : battle.challenger_score;

                return (
                  <Card
                    key={`tc-${battle.id}`}
                    className={`cursor-pointer hover:bg-dark-700/50 transition-colors ${
                      draw ? 'border-yellow-500/30' : won ? 'border-green-500/30' : 'border-red-500/30'
                    }`}
                    onClick={() => {
                      setDetailTuningBattle(battle);
                      setShowTuningDetailModal(true);
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
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
                          <span className="px-1.5 py-0.5 rounded bg-dark-600 text-dark-300">Wyzwanie</span>
                          <span>{CATEGORY_LABELS[battle.category as TuningCategory]?.icon} {CATEGORY_LABELS[battle.category as TuningCategory]?.name}</span>
                          <span>{myScore} : {theirScore}</span>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-dark-500 flex-shrink-0" />
                    </div>
                  </Card>
                );
              }
            })
          )}
        </div>
      )}

      {/* ========== CARD BATTLE MODALS ========== */}

      {/* NEW CHALLENGE MODAL */}
      <Modal
        isOpen={showNewChallengeModal}
        onClose={closeNewChallengeModal}
        title="Nowe wyzwanie"
      >
        <div className="space-y-4">
          {challengeStep === 'select_opponent' && (
            <>
              <p className="text-dark-400 text-sm">Wybierz przeciwnika:</p>
              <div className="max-h-64 overflow-y-auto space-y-2">
                {availablePlayers.length === 0 ? (
                  <p className="text-center text-dark-500 py-4">
                    Brak graczy z wystarczajaca liczba kart (min. 3)
                  </p>
                ) : (
                  availablePlayers.map(player => (
                    <button
                      key={player.id}
                      onClick={() => handleSelectOpponent(player)}
                      className="w-full flex items-center gap-3 p-3 bg-dark-700 rounded-xl hover:bg-dark-600 transition-colors"
                    >
                      <Avatar src={player.avatar_url} fallback={player.nick} size="sm" />
                      <div className="flex-1 text-left">
                        <p className="font-medium text-white">{player.nick}</p>
                        <p className="text-xs text-dark-400">Poziom {player.level}</p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-dark-400" />
                    </button>
                  ))
                )}
              </div>
            </>
          )}

          {challengeStep === 'dealing' && (
            <div className="text-center py-8">
              <Shuffle className="w-16 h-16 text-turbo-400 mx-auto mb-4 animate-spin" />
              <p className="text-lg font-bold text-white">Losowanie kart...</p>
              <p className="text-sm text-dark-400 mt-2">System wybiera 3 karty z Twojej kolekcji</p>
            </div>
          )}

          {challengeStep === 'assign_slots' && (
            <>
              <div className="flex items-center gap-2 mb-2">
                <Avatar src={selectedOpponent?.avatar_url} fallback={selectedOpponent?.nick || '?'} size="sm" />
                <span className="text-white font-medium">vs {selectedOpponent?.nick}</span>
              </div>

              <p className="text-dark-400 text-sm">Przydziel karty do kategorii:</p>

              {/* Sloty */}
              <div className="space-y-2">
                {(['power', 'torque', 'speed'] as BattleRoundCategory[]).map(cat => {
                  const assignedCardId = slotAssignment[cat];
                  const assignedCard = assignedCardId ? getCardById(dealtCards, assignedCardId) : null;

                  return (
                    <button
                      key={cat}
                      onClick={() => {
                        if (selectedCardForSlot) {
                          handleAssignCardToSlot(selectedCardForSlot, cat);
                        } else if (assignedCardId) {
                          setSlotAssignment(prev => {
                            const updated = { ...prev };
                            delete updated[cat];
                            return updated;
                          });
                        }
                      }}
                      className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 border-dashed transition-all ${
                        selectedCardForSlot
                          ? 'border-turbo-500 bg-turbo-500/10 hover:bg-turbo-500/20'
                          : assignedCard
                            ? 'border-orange-500/50 bg-dark-700'
                            : 'border-dark-500 bg-dark-800'
                      }`}
                    >
                      <span className="text-xl w-8 text-center">{getCategoryIcon(cat)}</span>
                      <div className="flex-1 text-left">
                        <p className="text-sm font-medium text-dark-300">{getCategoryName(cat)}</p>
                        {assignedCard ? (
                          <p className="text-white font-medium">{assignedCard.name}</p>
                        ) : (
                          <p className="text-dark-500 text-sm">
                            {selectedCardForSlot ? 'Kliknij, aby przydzielić' : 'Pusty slot'}
                          </p>
                        )}
                      </div>
                      {assignedCard && (
                        <span className="text-sm text-orange-400 font-bold">
                          {cat === 'power' && `${assignedCard.car_horsepower} KM`}
                          {cat === 'torque' && `${assignedCard.car_torque} Nm`}
                          {cat === 'speed' && `${assignedCard.car_max_speed} km/h`}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Nieprzydzielone karty */}
              {getUnassignedCards(dealtCards, slotAssignment).length > 0 && (
                <>
                  <p className="text-dark-400 text-sm mt-2">Twoje wylosowane karty:</p>
                  <div className="space-y-2">
                    {getUnassignedCards(dealtCards, slotAssignment).map(card => (
                      <button
                        key={card.id}
                        onClick={() => setSelectedCardForSlot(
                          selectedCardForSlot === card.id ? null : card.id
                        )}
                        className={`w-full flex items-center gap-3 p-3 rounded-xl transition-colors ${
                          selectedCardForSlot === card.id
                            ? 'bg-turbo-500/20 border border-turbo-500'
                            : 'bg-dark-700 hover:bg-dark-600'
                        }`}
                      >
                        <div className="w-14 h-10 bg-dark-600 rounded-lg overflow-hidden flex-shrink-0">
                          {card.image_url && (
                            <img src={card.image_url} alt={card.name} className="w-full h-full object-cover" />
                          )}
                        </div>
                        <div className="flex-1 text-left min-w-0">
                          <p className="font-medium text-white text-sm truncate">{card.name}</p>
                          <div className="flex gap-3 text-xs text-dark-400">
                            <span>⚡{card.car_horsepower}</span>
                            <span>🔧{card.car_torque}</span>
                            <span>💨{card.car_max_speed}</span>
                          </div>
                        </div>
                        {selectedCardForSlot === card.id && (
                          <ArrowRight className="w-5 h-5 text-turbo-400 animate-pulse" />
                        )}
                      </button>
                    ))}
                  </div>
                </>
              )}

              <Button
                fullWidth
                loading={isSubmitting}
                disabled={!slotAssignment.power || !slotAssignment.torque || !slotAssignment.speed}
                onClick={handleSendChallenge}
              >
                <Swords className="w-4 h-4 mr-2" />
                Wyslij wyzwanie
              </Button>
            </>
          )}
        </div>
      </Modal>

      {/* ACCEPT CARD CHALLENGE MODAL */}
      <Modal
        isOpen={showAcceptModal}
        onClose={closeAcceptModal}
        title={acceptStep === 'revealing' || acceptStep === 'done' ? 'Wynik bitwy' : 'Akceptuj wyzwanie'}
      >
        <div className="space-y-4">
          {acceptStep === 'dealing' && (
            <div className="text-center py-8">
              <Shuffle className="w-16 h-16 text-turbo-400 mx-auto mb-4 animate-spin" />
              <p className="text-lg font-bold text-white">Losowanie kart...</p>
              <p className="text-sm text-dark-400 mt-2">System wybiera 3 karty z Twojej kolekcji</p>
            </div>
          )}

          {acceptStep === 'assign_slots' && (
            <>
              <p className="text-dark-400 text-sm">Przydziel karty do kategorii:</p>

              <div className="space-y-2">
                {(['power', 'torque', 'speed'] as BattleRoundCategory[]).map(cat => {
                  const assignedCardId = acceptSlotAssignment[cat];
                  const assignedCard = assignedCardId ? getCardById(acceptDealtCards, assignedCardId) : null;

                  return (
                    <button
                      key={cat}
                      onClick={() => {
                        if (acceptSelectedCard) {
                          handleAcceptAssignCard(acceptSelectedCard, cat);
                        } else if (assignedCardId) {
                          setAcceptSlotAssignment(prev => {
                            const updated = { ...prev };
                            delete updated[cat];
                            return updated;
                          });
                        }
                      }}
                      className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 border-dashed transition-all ${
                        acceptSelectedCard
                          ? 'border-turbo-500 bg-turbo-500/10 hover:bg-turbo-500/20'
                          : assignedCard
                            ? 'border-orange-500/50 bg-dark-700'
                            : 'border-dark-500 bg-dark-800'
                      }`}
                    >
                      <span className="text-xl w-8 text-center">{getCategoryIcon(cat)}</span>
                      <div className="flex-1 text-left">
                        <p className="text-sm font-medium text-dark-300">{getCategoryName(cat)}</p>
                        {assignedCard ? (
                          <p className="text-white font-medium">{assignedCard.name}</p>
                        ) : (
                          <p className="text-dark-500 text-sm">
                            {acceptSelectedCard ? 'Kliknij, aby przydzielić' : 'Pusty slot'}
                          </p>
                        )}
                      </div>
                      {assignedCard && (
                        <span className="text-sm text-orange-400 font-bold">
                          {cat === 'power' && `${assignedCard.car_horsepower} KM`}
                          {cat === 'torque' && `${assignedCard.car_torque} Nm`}
                          {cat === 'speed' && `${assignedCard.car_max_speed} km/h`}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {getUnassignedCards(acceptDealtCards, acceptSlotAssignment).length > 0 && (
                <>
                  <p className="text-dark-400 text-sm mt-2">Twoje wylosowane karty:</p>
                  <div className="space-y-2">
                    {getUnassignedCards(acceptDealtCards, acceptSlotAssignment).map(card => (
                      <button
                        key={card.id}
                        onClick={() => setAcceptSelectedCard(
                          acceptSelectedCard === card.id ? null : card.id
                        )}
                        className={`w-full flex items-center gap-3 p-3 rounded-xl transition-colors ${
                          acceptSelectedCard === card.id
                            ? 'bg-turbo-500/20 border border-turbo-500'
                            : 'bg-dark-700 hover:bg-dark-600'
                        }`}
                      >
                        <div className="w-14 h-10 bg-dark-600 rounded-lg overflow-hidden flex-shrink-0">
                          {card.image_url && (
                            <img src={card.image_url} alt={card.name} className="w-full h-full object-cover" />
                          )}
                        </div>
                        <div className="flex-1 text-left min-w-0">
                          <p className="font-medium text-white text-sm truncate">{card.name}</p>
                          <div className="flex gap-3 text-xs text-dark-400">
                            <span>⚡{card.car_horsepower}</span>
                            <span>🔧{card.car_torque}</span>
                            <span>💨{card.car_max_speed}</span>
                          </div>
                        </div>
                        {acceptSelectedCard === card.id && (
                          <ArrowRight className="w-5 h-5 text-turbo-400 animate-pulse" />
                        )}
                      </button>
                    ))}
                  </div>
                </>
              )}

              <Button
                fullWidth
                loading={isSubmitting}
                disabled={!acceptSlotAssignment.power || !acceptSlotAssignment.torque || !acceptSlotAssignment.speed}
                onClick={handleFight}
              >
                <Swords className="w-4 h-4 mr-2" />
                Walcz!
              </Button>
            </>
          )}

          {/* REVEAL ANIMATION */}
          {(acceptStep === 'revealing' || acceptStep === 'done') && revealResults && (
            <>
              <div className="space-y-3">
                {revealResults.map((round, i) => (
                  <div
                    key={round.category}
                    className={`transition-all duration-500 ${
                      i < revealedRound ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                    }`}
                  >
                    <div className="text-xs text-dark-400 mb-1 font-medium">
                      Runda {i + 1}: {getCategoryIcon(round.category)} {getCategoryName(round.category)}
                    </div>
                    <div className={`flex items-center gap-2 p-3 rounded-xl ${
                      round.winner === 'draw' ? 'bg-blue-500/10 border border-blue-500/30' :
                      (round.winner === 'challenger' && profile.id === incomingChallenges.find(b => b.id === selectedBattleId)?.challenger_id) ||
                      (round.winner === 'opponent' && profile.id !== incomingChallenges.find(b => b.id === selectedBattleId)?.challenger_id)
                        ? 'bg-green-500/10 border border-green-500/30'
                        : 'bg-red-500/10 border border-red-500/30'
                    }`}>
                      <div className="flex-1 text-center">
                        <div className="text-lg font-bold text-white">{round.challenger_value}</div>
                        <div className="text-xs text-dark-400">Wyzywajacy</div>
                      </div>
                      <div className="text-dark-500 font-bold text-sm">VS</div>
                      <div className="flex-1 text-center">
                        <div className="text-lg font-bold text-white">{round.opponent_value}</div>
                        <div className="text-xs text-dark-400">Ty</div>
                      </div>
                      <div className="w-8 flex justify-center">
                        {round.winner === 'draw' ? (
                          <Minus className="w-5 h-5 text-blue-400" />
                        ) : round.winner === 'opponent' ? (
                          <Check className="w-5 h-5 text-green-400" />
                        ) : (
                          <X className="w-5 h-5 text-red-400" />
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Final result */}
              {acceptStep === 'done' && (
                <div className={`text-center py-4 rounded-xl mt-2 transition-all duration-500 ${
                  revealWinnerId === null ? 'bg-blue-500/20' :
                  revealWinnerId === profile.id ? 'bg-green-500/20' : 'bg-red-500/20'
                }`}>
                  <div className="flex items-center justify-center gap-2 mb-1">
                    {revealWinnerId === null ? (
                      <Minus className="w-6 h-6 text-blue-400" />
                    ) : revealWinnerId === profile.id ? (
                      <Crown className="w-6 h-6 text-yellow-400" />
                    ) : (
                      <X className="w-6 h-6 text-red-400" />
                    )}
                    <span className={`text-xl font-bold ${
                      revealWinnerId === null ? 'text-blue-400' :
                      revealWinnerId === profile.id ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {revealWinnerId === null ? 'Remis!' :
                       revealWinnerId === profile.id ? 'Wygrana!' : 'Przegrana'}
                    </span>
                  </div>
                  <p className="text-sm text-dark-300">
                    {revealWinnerId === null ? '+10 XP' :
                     revealWinnerId === profile.id ? '+30 XP' : 'Brak XP'}
                  </p>
                </div>
              )}

              {acceptStep === 'done' && (
                <Button fullWidth onClick={closeAcceptModal}>
                  Zamknij
                </Button>
              )}
            </>
          )}
        </div>
      </Modal>

      {/* BATTLE DETAIL MODAL */}
      <Modal
        isOpen={showDetailModal}
        onClose={() => {
          setShowDetailModal(false);
          setDetailBattle(null);
        }}
        title="Szczegoly bitwy"
      >
        {detailBattle && (() => {
          const iAmChallenger = detailBattle.challenger_id === profile.id;
          const isWinner = detailBattle.winner_id === profile.id;
          const isDraw = !detailBattle.winner_id;
          const myScore = iAmChallenger ? detailBattle.challenger_score : detailBattle.opponent_score;
          const theirScore = iAmChallenger ? detailBattle.opponent_score : detailBattle.challenger_score;
          const opponent = iAmChallenger ? detailBattle.opponent : detailBattle.challenger;
          const rounds = (detailBattle.round_results || []) as BattleRoundResult[];

          const allCards = new Map<string, CollectibleCard>();
          (detailBattle.challenger_cards || []).forEach((c: CollectibleCard) => allCards.set(c.id, c));
          (detailBattle.opponent_cards || []).forEach((c: CollectibleCard) => allCards.set(c.id, c));

          return (
            <div className="space-y-4">
              {/* Result banner */}
              <div className={`text-center py-3 rounded-xl ${
                isDraw ? 'bg-blue-500/20' : isWinner ? 'bg-green-500/20' : 'bg-red-500/20'
              }`}>
                <div className="flex items-center justify-center gap-2 mb-1">
                  {isDraw ? (
                    <Minus className="w-6 h-6 text-blue-400" />
                  ) : isWinner ? (
                    <Crown className="w-6 h-6 text-yellow-400" />
                  ) : (
                    <X className="w-6 h-6 text-red-400" />
                  )}
                  <span className={`text-lg font-bold ${
                    isDraw ? 'text-blue-400' : isWinner ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {isDraw ? 'Remis!' : isWinner ? 'Wygrana!' : 'Przegrana'}
                  </span>
                </div>
                <p className="text-sm text-dark-300">
                  Wynik rund: {myScore}-{theirScore}
                </p>
              </div>

              {/* Players */}
              <div className="flex items-center gap-3">
                <div className="flex-1 text-center">
                  <Avatar src={profile.avatar_url} fallback={profile.nick} size="md" />
                  <p className="text-sm font-medium text-white mt-1">{profile.nick}</p>
                </div>
                <div className="text-dark-500 font-bold text-lg">VS</div>
                <div className="flex-1 text-center">
                  <Avatar src={opponent?.avatar_url} fallback={opponent?.nick || '?'} size="md" />
                  <p className="text-sm font-medium text-white mt-1">{opponent?.nick}</p>
                </div>
              </div>

              {/* Round details */}
              <div className="space-y-3">
                {rounds.map((round, i) => {
                  const myCardId = iAmChallenger ? round.challenger_card_id : round.opponent_card_id;
                  const theirCardId = iAmChallenger ? round.opponent_card_id : round.challenger_card_id;
                  const myValue = iAmChallenger ? round.challenger_value : round.opponent_value;
                  const theirValue = iAmChallenger ? round.opponent_value : round.challenger_value;
                  const myCard = allCards.get(myCardId);
                  const theirCard = allCards.get(theirCardId);
                  const iWonRound = (iAmChallenger && round.winner === 'challenger') || (!iAmChallenger && round.winner === 'opponent');
                  const roundDraw = round.winner === 'draw';

                  return (
                    <div key={round.category}>
                      <div className="text-xs text-dark-400 mb-1 font-medium">
                        Runda {i + 1}: {getCategoryIcon(round.category)} {getCategoryName(round.category)}
                      </div>
                      <div className={`p-3 rounded-xl ${
                        roundDraw ? 'bg-blue-500/10 border border-blue-500/30' :
                        iWonRound ? 'bg-green-500/10 border border-green-500/30' :
                        'bg-red-500/10 border border-red-500/30'
                      }`}>
                        <div className="flex items-center gap-2">
                          <div className="flex-1">
                            <p className="text-xs text-dark-400 truncate">{myCard?.name || '?'}</p>
                            <p className={`text-lg font-bold ${roundDraw ? 'text-blue-400' : iWonRound ? 'text-green-400' : 'text-red-400'}`}>
                              {myValue}
                            </p>
                          </div>
                          <div className="text-dark-500 text-sm font-bold">VS</div>
                          <div className="flex-1 text-right">
                            <p className="text-xs text-dark-400 truncate">{theirCard?.name || '?'}</p>
                            <p className={`text-lg font-bold ${roundDraw ? 'text-blue-400' : !iWonRound ? 'text-green-400' : 'text-red-400'}`}>
                              {theirValue}
                            </p>
                          </div>
                          <div className="w-6 flex justify-center">
                            {roundDraw ? (
                              <Minus className="w-4 h-4 text-blue-400" />
                            ) : iWonRound ? (
                              <Check className="w-4 h-4 text-green-400" />
                            ) : (
                              <X className="w-4 h-4 text-red-400" />
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Reward info */}
              <div className="text-center text-sm text-dark-400 pt-2 border-t border-dark-700">
                {isWinner ? 'Nagroda: +30 XP' : isDraw ? 'Remis: +10 XP' : 'Przegrana: brak XP'}
              </div>
            </div>
          );
        })()}
      </Modal>

      {/* ========== TUNING CHALLENGE MODALS ========== */}

      {/* POST TUNING CHALLENGE MODAL */}
      <Modal
        isOpen={showPostTuningModal}
        onClose={() => setShowPostTuningModal(false)}
        title="Wystaw wyzwanie"
      >
        <div className="space-y-4">
          {/* Wybor auta */}
          <div>
            <h4 className="text-sm font-medium text-dark-300 mb-2">Wybierz auto</h4>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {tunedCars.map(tc => {
                const card = tc.card;
                if (!card) return null;
                const isSelected = selectedTunedCar?.id === tc.id;
                return (
                  <button
                    key={tc.id}
                    onClick={() => setSelectedTunedCar(tc)}
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
                      <div className="flex items-center gap-2 text-xs text-dark-400 mt-0.5">
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
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Wybor kategorii */}
          <div>
            <h4 className="text-sm font-medium text-dark-300 mb-2">Wybierz kategorie</h4>
            <div className="grid grid-cols-2 gap-2">
              {(Object.entries(CATEGORY_LABELS) as [TuningCategory, typeof CATEGORY_LABELS[TuningCategory]][]).map(([key, cat]) => {
                const score = selectedTunedCar ? calculateScore(selectedTunedCar, key) : 0;
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
                    {selectedTunedCar && (
                      <div className="text-xs text-turbo-400 mt-1 font-medium">Score: {score}</div>
                    )}
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
            onClick={handlePostTuningChallenge}
            disabled={tuningActionLoading || !selectedTunedCar}
          >
            <Swords className="w-4 h-4 mr-2" />
            Wystaw wyzwanie
          </Button>
        </div>
      </Modal>

      {/* ACCEPT TUNING CHALLENGE MODAL */}
      <Modal
        isOpen={showAcceptTuningModal}
        onClose={() => setShowAcceptTuningModal(false)}
        title="Podejmij wyzwanie"
      >
        {selectedTuningChallenge && (
          <div className="space-y-4">
            {/* Info o wyzwaniu */}
            <div className="p-3 rounded-xl bg-dark-700">
              <div className="flex items-center gap-3">
                <Avatar
                  src={(selectedTuningChallenge.challenger as unknown as { avatar_url?: string })?.avatar_url}
                  fallback={(selectedTuningChallenge.challenger as unknown as { nick: string })?.nick || '?'}
                  size="sm"
                />
                <div>
                  <h4 className="text-sm font-medium text-white">
                    {(selectedTuningChallenge.challenger as unknown as { nick: string })?.nick || 'Gracz'}
                  </h4>
                  <span className="text-xs text-orange-400">
                    {CATEGORY_LABELS[selectedTuningChallenge.category as TuningCategory]?.icon}{' '}
                    {CATEGORY_LABELS[selectedTuningChallenge.category as TuningCategory]?.name}
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
                    const score = calculateScore(tc, selectedTuningChallenge.category as TuningCategory);
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
                  Brak tuningowanych aut. Dodaj auto w Strefie Tuningu!
                </div>
              )}
            </div>

            <Button
              variant="primary"
              fullWidth
              onClick={handleAcceptTuningChallenge}
              disabled={tuningActionLoading || !selectedAcceptCar}
            >
              <Swords className="w-4 h-4 mr-2" />
              Walcz!
            </Button>
          </div>
        )}
      </Modal>

      {/* TUNING RESULT MODAL */}
      <Modal
        isOpen={showTuningResultModal}
        onClose={() => {
          setShowTuningResultModal(false);
          setTuningBattleResult(null);
        }}
        title="Wynik bitwy"
      >
        {tuningBattleResult && (
          <div className="space-y-4 text-center">
            {/* Win/Lose/Draw */}
            <div className={`py-4 rounded-xl ${
              tuningBattleResult.winnerId === profile.id
                ? 'bg-green-500/20'
                : !tuningBattleResult.winnerId
                  ? 'bg-yellow-500/20'
                  : 'bg-red-500/20'
            }`}>
              {tuningBattleResult.winnerId === profile.id ? (
                <>
                  <Crown className="w-12 h-12 text-green-400 mx-auto mb-2" />
                  <h3 className="text-xl font-bold text-green-400">WYGRANA!</h3>
                  <p className="text-sm text-green-300 mt-1">+30 XP</p>
                </>
              ) : !tuningBattleResult.winnerId ? (
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
              {CATEGORY_LABELS[tuningBattleResult.category]?.icon}{' '}
              {CATEGORY_LABELS[tuningBattleResult.category]?.name}
            </div>

            {/* Scores */}
            <div className="flex items-center justify-center gap-4">
              <div className="text-center">
                <p className="text-xs text-dark-500 mb-1">Ty</p>
                <div className="text-2xl font-bold text-white">
                  {tuningBattleResult.challengerCar.user_id === profile.id
                    ? tuningBattleResult.challengerScore
                    : tuningBattleResult.opponentScore}
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-dark-600 rotate-0" />
              <div className="text-center">
                <p className="text-xs text-dark-500 mb-1">Przeciwnik</p>
                <div className="text-2xl font-bold text-white">
                  {tuningBattleResult.challengerCar.user_id === profile.id
                    ? tuningBattleResult.opponentScore
                    : tuningBattleResult.challengerScore}
                </div>
              </div>
            </div>

            {/* Szczegoly */}
            <div className="p-3 rounded-xl bg-dark-700 text-xs text-dark-400">
              <div className="flex items-center justify-between">
                <span>Wagi: KM x{CATEGORY_WEIGHTS[tuningBattleResult.category].hp}, Nm x{CATEGORY_WEIGHTS[tuningBattleResult.category].torque}, km/h x{CATEGORY_WEIGHTS[tuningBattleResult.category].speed}</span>
              </div>
            </div>

            <Button
              variant="primary"
              fullWidth
              onClick={() => {
                setShowTuningResultModal(false);
                setTuningBattleResult(null);
              }}
            >
              Zamknij
            </Button>
          </div>
        )}
      </Modal>

      {/* TUNING CHALLENGE DETAIL MODAL */}
      <Modal
        isOpen={showTuningDetailModal}
        onClose={() => {
          setShowTuningDetailModal(false);
          setDetailTuningBattle(null);
        }}
        title="Szczegoly wyzwania"
      >
        {detailTuningBattle && (() => {
          const b = detailTuningBattle;
          const iAmChallenger = b.challenger_id === profile.id;
          const won = b.winner_id === profile.id;
          const draw = !b.winner_id;
          const myScore = iAmChallenger ? b.challenger_score : b.opponent_score;
          const theirScore = iAmChallenger ? b.opponent_score : b.challenger_score;
          const opponentUser = iAmChallenger ? b.opponent : b.challenger;
          const myCar = iAmChallenger ? b.tuned_car : b.opponent_tuned_car;
          const theirCar = iAmChallenger ? b.opponent_tuned_car : b.tuned_car;
          const category = b.category as TuningCategory;
          const catLabel = CATEGORY_LABELS[category];
          const weights = CATEGORY_WEIGHTS[category];

          return (
            <div className="space-y-4">
              {/* Result banner */}
              <div className={`text-center py-3 rounded-xl ${
                draw ? 'bg-yellow-500/20' : won ? 'bg-green-500/20' : 'bg-red-500/20'
              }`}>
                <div className="flex items-center justify-center gap-2 mb-1">
                  {draw ? (
                    <Minus className="w-6 h-6 text-yellow-400" />
                  ) : won ? (
                    <Crown className="w-6 h-6 text-yellow-400" />
                  ) : (
                    <X className="w-6 h-6 text-red-400" />
                  )}
                  <span className={`text-lg font-bold ${
                    draw ? 'text-yellow-400' : won ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {draw ? 'Remis!' : won ? 'Wygrana!' : 'Przegrana'}
                  </span>
                </div>
                <p className="text-sm text-dark-300">
                  {won ? '+30 XP' : draw ? 'Brak XP' : 'Brak XP'}
                </p>
              </div>

              {/* Category */}
              <div className="text-center text-sm text-dark-400">
                {catLabel?.icon} {catLabel?.name}
              </div>

              {/* Score comparison */}
              <div className="flex items-center justify-center gap-6">
                <div className="text-center">
                  <p className="text-xs text-dark-500 mb-1">Ty</p>
                  <div className={`text-2xl font-bold ${draw ? 'text-yellow-400' : won ? 'text-green-400' : 'text-red-400'}`}>
                    {myScore}
                  </div>
                </div>
                <div className="text-dark-600 font-bold">VS</div>
                <div className="text-center">
                  <p className="text-xs text-dark-500 mb-1">{(opponentUser as unknown as { nick: string })?.nick || 'Przeciwnik'}</p>
                  <div className={`text-2xl font-bold ${draw ? 'text-yellow-400' : !won ? 'text-green-400' : 'text-red-400'}`}>
                    {theirScore}
                  </div>
                </div>
              </div>

              {/* Cars comparison */}
              <div className="space-y-3">
                {/* My car */}
                <div className="p-3 rounded-xl bg-dark-700">
                  <p className="text-[10px] uppercase tracking-wider text-dark-500 mb-2">Twoje auto</p>
                  <div className="flex items-center gap-3">
                    <div className="w-14 h-10 rounded-lg overflow-hidden flex-shrink-0 bg-dark-800">
                      {myCar?.card?.image_url ? (
                        <img src={myCar.card.image_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Car className="w-5 h-5 text-dark-500" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">
                        {myCar?.card?.car_brand} {myCar?.card?.car_model}
                      </p>
                      <div className="flex items-center gap-3 mt-0.5 text-xs text-dark-400">
                        <span className="flex items-center gap-1"><Zap className="w-3 h-3 text-yellow-500" />{myCar?.card?.car_horsepower || '?'}</span>
                        <span className="flex items-center gap-1"><Gauge className="w-3 h-3 text-blue-500" />{myCar?.card?.car_torque || '?'}</span>
                        <span className="flex items-center gap-1"><Timer className="w-3 h-3 text-red-500" />{myCar?.card?.car_max_speed || '?'}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Their car */}
                <div className="p-3 rounded-xl bg-dark-700">
                  <p className="text-[10px] uppercase tracking-wider text-dark-500 mb-2">Auto przeciwnika</p>
                  <div className="flex items-center gap-3">
                    <div className="w-14 h-10 rounded-lg overflow-hidden flex-shrink-0 bg-dark-800">
                      {theirCar?.card?.image_url ? (
                        <img src={theirCar.card.image_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Car className="w-5 h-5 text-dark-500" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">
                        {theirCar?.card?.car_brand} {theirCar?.card?.car_model}
                      </p>
                      <div className="flex items-center gap-3 mt-0.5 text-xs text-dark-400">
                        <span className="flex items-center gap-1"><Zap className="w-3 h-3 text-yellow-500" />{theirCar?.card?.car_horsepower || '?'}</span>
                        <span className="flex items-center gap-1"><Gauge className="w-3 h-3 text-blue-500" />{theirCar?.card?.car_torque || '?'}</span>
                        <span className="flex items-center gap-1"><Timer className="w-3 h-3 text-red-500" />{theirCar?.card?.car_max_speed || '?'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Category weights */}
              <div className="p-3 rounded-xl bg-dark-700 text-xs text-dark-400">
                <p className="mb-1 text-dark-500">Wagi kategorii</p>
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1"><Zap className="w-3 h-3 text-yellow-500" />x{weights.hp}</span>
                  <span className="flex items-center gap-1"><Gauge className="w-3 h-3 text-blue-500" />x{weights.torque}</span>
                  <span className="flex items-center gap-1"><Timer className="w-3 h-3 text-red-500" />x{weights.speed}</span>
                </div>
              </div>
            </div>
          );
        })()}
      </Modal>
    </div>
  );
}
