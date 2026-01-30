'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useBattles, getCategoryName, getCategoryIcon } from '@/hooks/useBattles';
import { Card, Button, Avatar, Badge, Modal } from '@/components/ui';
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
} from 'lucide-react';
import { CollectibleCard, BattleSlotAssignment, BattleRoundCategory, BattleRoundResult, User } from '@/types';

type Tab = 'challenges' | 'my_battles' | 'new';

// Kroki tworzenia wyzwania
type ChallengeStep = 'select_opponent' | 'dealing' | 'assign_slots' | 'confirm';

// Kroki akceptowania wyzwania
type AcceptStep = 'dealing' | 'assign_slots' | 'revealing' | 'done';

export function BattlesContent() {
  const { profile } = useAuth();
  const {
    myBattles,
    incomingChallenges,
    loading,
    createChallenge,
    acceptChallenge,
    declineChallenge,
    getChallengablePlayers,
    dealRandomCards,
    getChallengesSentThisWeek,
  } = useBattles({ userId: profile?.id });
  const { success, error: showError } = useToast();

  const [activeTab, setActiveTab] = useState<Tab>('challenges');
  const [challengesSentThisWeek, setChallengesSentThisWeek] = useState(0);

  // Create challenge state
  const [showNewChallengeModal, setShowNewChallengeModal] = useState(false);
  const [challengeStep, setChallengeStep] = useState<ChallengeStep>('select_opponent');
  const [availablePlayers, setAvailablePlayers] = useState<User[]>([]);
  const [selectedOpponent, setSelectedOpponent] = useState<User | null>(null);
  const [dealtCards, setDealtCards] = useState<CollectibleCard[]>([]);
  const [slotAssignment, setSlotAssignment] = useState<Partial<BattleSlotAssignment>>({});
  const [selectedCardForSlot, setSelectedCardForSlot] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Accept challenge state
  const [showAcceptModal, setShowAcceptModal] = useState(false);
  const [acceptStep, setAcceptStep] = useState<AcceptStep>('dealing');
  const [selectedBattleId, setSelectedBattleId] = useState<string | null>(null);
  const [acceptDealtCards, setAcceptDealtCards] = useState<CollectibleCard[]>([]);
  const [acceptSlotAssignment, setAcceptSlotAssignment] = useState<Partial<BattleSlotAssignment>>({});
  const [acceptSelectedCard, setAcceptSelectedCard] = useState<string | null>(null);

  // Reveal state
  const [revealResults, setRevealResults] = useState<BattleRoundResult[] | null>(null);
  const [revealedRound, setRevealedRound] = useState(0);
  const [revealWinnerId, setRevealWinnerId] = useState<string | null | undefined>(undefined);

  // Detail modal
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [detailBattle, setDetailBattle] = useState<typeof myBattles[0] | null>(null);

  // Load stats
  useEffect(() => {
    if (profile?.id) {
      getChallengesSentThisWeek().then(setChallengesSentThisWeek);
    }
  }, [profile?.id, getChallengesSentThisWeek]);

  // Load players when opening new challenge modal
  useEffect(() => {
    if (showNewChallengeModal && profile?.id) {
      getChallengablePlayers(20).then(setAvailablePlayers);
    }
  }, [showNewChallengeModal, profile?.id, getChallengablePlayers]);

  // --- CHALLENGE CREATION ---

  const handleSelectOpponent = async (opponent: User) => {
    setSelectedOpponent(opponent);
    setChallengeStep('dealing');

    // Losuj karty
    try {
      const cards = await dealRandomCards(profile!.id);
      setDealtCards(cards);
      // Po krótkim "losowaniu" przejdź do przydziału
      setTimeout(() => setChallengeStep('assign_slots'), 1500);
    } catch (e: any) {
      showError('Błąd', e.message || 'Nie udało się wylosować kart');
      setChallengeStep('select_opponent');
    }
  };

  const handleAssignCardToSlot = (cardId: string, slot: BattleRoundCategory) => {
    setSlotAssignment(prev => {
      const updated = { ...prev };
      // Jeśli karta jest już gdzieś przypisana, usuń ją stamtąd
      for (const key of ['power', 'torque', 'speed'] as BattleRoundCategory[]) {
        if (updated[key] === cardId) {
          delete updated[key];
        }
      }
      // Jeśli slot jest zajęty przez inną kartę, cofnij ją
      // (karta wraca do puli nieprzydzielonych)
      updated[slot] = cardId;
      return updated;
    });
    setSelectedCardForSlot(null);
  };

  const handleSendChallenge = async () => {
    if (!selectedOpponent || !slotAssignment.power || !slotAssignment.torque || !slotAssignment.speed) {
      showError('Błąd', 'Przydziel karty do wszystkich slotów');
      return;
    }

    setIsSubmitting(true);
    const result = await createChallenge(
      selectedOpponent.id,
      dealtCards,
      slotAssignment as BattleSlotAssignment
    );

    if (result.success) {
      success('Wyzwanie wysłane!', `${selectedOpponent.nick} otrzymał Twoje wyzwanie`);
      closeNewChallengeModal();
      getChallengesSentThisWeek().then(setChallengesSentThisWeek);
    } else {
      showError('Błąd', result.error || 'Nie udało się wysłać wyzwania');
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

  // --- ACCEPTING CHALLENGE ---

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
      showError('Błąd', e.message || 'Nie udało się wylosować kart');
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
      showError('Błąd', 'Przydziel karty do wszystkich slotów');
      return;
    }

    setIsSubmitting(true);
    const result = await acceptChallenge(
      selectedBattleId,
      acceptDealtCards,
      acceptSlotAssignment as BattleSlotAssignment
    );

    if (result.success && result.results) {
      // Przejdź do animacji odsłonięcia
      setRevealResults(result.results);
      setRevealWinnerId(result.winnerId);
      setRevealedRound(0);
      setAcceptStep('revealing');

      // Odsłaniaj rundy po kolei
      setTimeout(() => setRevealedRound(1), 800);
      setTimeout(() => setRevealedRound(2), 1800);
      setTimeout(() => setRevealedRound(3), 2800);
      setTimeout(() => setAcceptStep('done'), 3600);

    } else {
      showError('Błąd', result.error || 'Nie udało się rozstrzygnąć bitwy');
    }
    setIsSubmitting(false);
  };

  const handleDeclineChallenge = async (battleId: string) => {
    const result = await declineChallenge(battleId);
    if (result.success) {
      success('Wyzwanie odrzucone', 'Odmówiłeś udziału w bitwie');
    } else {
      showError('Błąd', result.error || 'Nie udało się odrzucić wyzwania');
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

  // --- HELPERS ---

  const getUnassignedCards = (cards: CollectibleCard[], assignment: Partial<BattleSlotAssignment>) => {
    const assignedIds = new Set(Object.values(assignment).filter(Boolean));
    return cards.filter(c => !assignedIds.has(c.id));
  };

  const getCardById = (cards: CollectibleCard[], id: string) => cards.find(c => c.id === id);

  if (!profile) return null;

  // --- RENDER ---

  const tabs: { value: Tab; label: string; icon: React.ElementType; count?: number }[] = [
    { value: 'challenges', label: 'Wyzwania', icon: Swords, count: incomingChallenges.length },
    { value: 'my_battles', label: 'Historia', icon: Trophy },
  ];

  return (
    <div className="py-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Swords className="w-7 h-7 text-turbo-500" />
          Turbo Bitwy
        </h1>
        <div className="text-right">
          <div className="text-sm text-dark-400">Wyzwania w tygodniu</div>
          <div className={`text-lg font-bold ${challengesSentThisWeek >= 3 ? 'text-red-400' : 'text-turbo-400'}`}>
            {challengesSentThisWeek}/3
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {tabs.map(t => {
          const Icon = t.icon;
          return (
            <button
              key={t.value}
              onClick={() => setActiveTab(t.value)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-colors ${
                activeTab === t.value
                  ? 'bg-turbo-500 text-white'
                  : 'bg-dark-700 text-dark-300 hover:bg-dark-600'
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

      {/* Content */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <Card key={i} className="h-24 animate-pulse bg-dark-700" />
          ))}
        </div>
      ) : activeTab === 'challenges' ? (
        /* === INCOMING CHALLENGES === */
        <div className="space-y-4">
          {incomingChallenges.length === 0 ? (
            <Card className="text-center py-12">
              <Swords className="w-12 h-12 text-dark-600 mx-auto mb-3" />
              <p className="text-dark-400 font-medium">Brak wyzwań</p>
              <p className="text-sm text-dark-500 mt-1">
                Nikt Cię jeszcze nie wyzwał na pojedynek
              </p>
            </Card>
          ) : (
            incomingChallenges.map(battle => (
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
                  <span className="flex items-center gap-1">💨 Prędkość</span>
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
                    Odrzuć
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
            ))
          )}

          {/* Wyzwij gracza */}
          <button
            onClick={() => {
              if (challengesSentThisWeek >= 3) {
                showError('Limit', 'Osiągnąłeś limit 3 wyzwań na tydzień');
                return;
              }
              setShowNewChallengeModal(true);
            }}
            className={`w-full py-3 border-2 border-dashed rounded-xl flex items-center justify-center gap-2 transition-colors ${
              challengesSentThisWeek >= 3
                ? 'border-dark-700 text-dark-500 cursor-not-allowed'
                : 'border-dark-600 text-dark-400 hover:border-turbo-500/50 hover:text-turbo-400'
            }`}
          >
            <Users className="w-5 h-5" />
            Wyzwij gracza
          </button>
        </div>
      ) : (
        /* === BATTLE HISTORY === */
        <div className="space-y-4">
          {myBattles.length === 0 ? (
            <Card className="text-center py-12">
              <Trophy className="w-12 h-12 text-dark-600 mx-auto mb-3" />
              <p className="text-dark-400 font-medium">Brak historii bitew</p>
              <p className="text-sm text-dark-500 mt-1">
                Wyzwij kogoś na pojedynek!
              </p>
            </Card>
          ) : (
            myBattles.map(battle => {
              const isWinner = battle.winner_id === profile.id;
              const isDraw = battle.status === 'completed' && !battle.winner_id;
              const isPending = battle.status === 'pending';
              const isDeclined = battle.status === 'declined';
              const isCompleted = battle.status === 'completed';
              const opponent = battle.challenger_id === profile.id ? battle.opponent : battle.challenger;

              return (
                <Card
                  key={battle.id}
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
                        Best of 3: ⚡ Moc / 🔧 Moment / 💨 Prędkość
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
            })
          )}
        </div>
      )}

      {/* ========== NEW CHALLENGE MODAL ========== */}
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
                    Brak graczy z wystarczającą liczbą kart (min. 3)
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
                          // Cofnij kartę z slotu
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
                Wyślij wyzwanie
              </Button>
            </>
          )}
        </div>
      </Modal>

      {/* ========== ACCEPT CHALLENGE MODAL ========== */}
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

              {/* Sloty */}
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

              {/* Nieprzydzielone karty */}
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
                        <div className="text-xs text-dark-400">Wyzywający</div>
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

      {/* ========== BATTLE DETAIL MODAL ========== */}
      <Modal
        isOpen={showDetailModal}
        onClose={() => {
          setShowDetailModal(false);
          setDetailBattle(null);
        }}
        title="Szczegóły bitwy"
      >
        {detailBattle && (() => {
          const iAmChallenger = detailBattle.challenger_id === profile.id;
          const isWinner = detailBattle.winner_id === profile.id;
          const isDraw = !detailBattle.winner_id;
          const myScore = iAmChallenger ? detailBattle.challenger_score : detailBattle.opponent_score;
          const theirScore = iAmChallenger ? detailBattle.opponent_score : detailBattle.challenger_score;
          const opponent = iAmChallenger ? detailBattle.opponent : detailBattle.challenger;
          const rounds = (detailBattle.round_results || []) as BattleRoundResult[];

          // Map kart z obu stron
          const allCards = new Map<string, CollectibleCard>();
          (detailBattle.challenger_cards || []).forEach(c => allCards.set(c.id, c));
          (detailBattle.opponent_cards || []).forEach(c => allCards.set(c.id, c));

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
    </div>
  );
}
