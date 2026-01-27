'use client';

import { useState, useEffect } from 'react';
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
  Zap,
  AlertCircle,
  Target,
  Package,
  Gift,
  Eye,
  Crown,
  Minus,
} from 'lucide-react';
import Link from 'next/link';
import { CollectibleCard, BattleCategory, BattleRewardType, User } from '@/types';

type Tab = 'challenges' | 'my_battles' | 'new';

export default function BattlesPage() {
  const { profile } = useAuth();
  const {
    myBattles,
    incomingChallenges,
    loading,
    createChallenge,
    acceptChallenge,
    declineChallenge,
    getChallengablePlayers,
    getMyCars,
    getChallengesSentThisWeek,
    getBattleStats,
  } = useBattles({ userId: profile?.id });
  const { success, error: showError } = useToast();

  const [activeTab, setActiveTab] = useState<Tab>('challenges');
  const [battleStats, setBattleStats] = useState({ wins: 0, losses: 0, draws: 0 });
  const [challengesSentThisWeek, setChallengesSentThisWeek] = useState(0);

  // Modals
  const [showNewChallengeModal, setShowNewChallengeModal] = useState(false);
  const [showAcceptModal, setShowAcceptModal] = useState(false);
  const [showBattleDetailModal, setShowBattleDetailModal] = useState(false);
  const [selectedBattleId, setSelectedBattleId] = useState<string | null>(null);
  const [detailBattle, setDetailBattle] = useState<typeof myBattles[0] | null>(null);

  // New challenge state
  const [availablePlayers, setAvailablePlayers] = useState<User[]>([]);
  const [myCars, setMyCars] = useState<CollectibleCard[]>([]);
  const [selectedOpponent, setSelectedOpponent] = useState<User | null>(null);
  const [selectedCards, setSelectedCards] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<BattleCategory>('total');
  const [selectedRewardType, setSelectedRewardType] = useState<BattleRewardType>('xp');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load stats
  useEffect(() => {
    if (profile?.id) {
      getBattleStats().then(setBattleStats);
      getChallengesSentThisWeek().then(setChallengesSentThisWeek);
    }
  }, [profile?.id, getBattleStats, getChallengesSentThisWeek]);

  // Load players and cars when opening new challenge modal
  useEffect(() => {
    if (showNewChallengeModal && profile?.id) {
      getChallengablePlayers(20).then(setAvailablePlayers);
      getMyCars().then(setMyCars);
    }
  }, [showNewChallengeModal, profile?.id, getChallengablePlayers, getMyCars]);

  // Load my cars when accepting challenge
  useEffect(() => {
    if (showAcceptModal && profile?.id) {
      getMyCars().then(setMyCars);
    }
  }, [showAcceptModal, profile?.id, getMyCars]);

  const handleCreateChallenge = async () => {
    if (!selectedOpponent || selectedCards.length < 2) {
      showError('Błąd', 'Wybierz przeciwnika i minimum 2 karty');
      return;
    }

    setIsSubmitting(true);
    const result = await createChallenge(
      selectedOpponent.id,
      selectedCards,
      selectedCategory,
      selectedRewardType
    );

    if (result.success) {
      success('Wyzwanie wysłane!', `${selectedOpponent.nick} otrzymał Twoje wyzwanie`);
      setShowNewChallengeModal(false);
      resetNewChallengeState();
      getChallengesSentThisWeek().then(setChallengesSentThisWeek);
    } else {
      showError('Błąd', result.error || 'Nie udało się wysłać wyzwania');
    }
    setIsSubmitting(false);
  };

  const handleAcceptChallenge = async () => {
    if (!selectedBattleId || selectedCards.length < 2) {
      showError('Błąd', 'Wybierz minimum 2 karty');
      return;
    }

    setIsSubmitting(true);
    const result = await acceptChallenge(selectedBattleId, selectedCards);

    if (result.success) {
      if (result.winner === profile?.id) {
        success('Wygrałeś! 🏆', 'Gratulacje, Twoje karty były lepsze!');
      } else if (result.winner) {
        showError('Przegrałeś', 'Tym razem przeciwnik był lepszy');
      } else {
        success('Remis!', 'Macie identyczne wyniki');
      }
      setShowAcceptModal(false);
      setSelectedBattleId(null);
      setSelectedCards([]);
      getBattleStats().then(setBattleStats);
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

  const resetNewChallengeState = () => {
    setSelectedOpponent(null);
    setSelectedCards([]);
    setSelectedCategory('total');
    setSelectedRewardType('xp');
  };

  const toggleCardSelection = (cardId: string) => {
    setSelectedCards(prev =>
      prev.includes(cardId)
        ? prev.filter(id => id !== cardId)
        : [...prev, cardId]
    );
  };

  const selectedBattle = incomingChallenges.find(b => b.id === selectedBattleId);

  if (!profile) return null;

  return (
    <div className="py-4 space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-orange-500/20 mb-3">
          <Swords className="w-8 h-8 text-orange-500" />
        </div>
        <h1 className="text-2xl font-bold text-white">Turbo Bitwy</h1>
        <p className="text-dark-400 mt-1">
          Wyzwij innych graczy na pojedynek kart!
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card padding="sm" className="text-center">
          <Trophy className="w-5 h-5 text-yellow-500 mx-auto mb-1" />
          <div className="text-lg font-bold text-white">{battleStats.wins}</div>
          <div className="text-xs text-dark-400">Wygrane</div>
        </Card>
        <Card padding="sm" className="text-center">
          <X className="w-5 h-5 text-red-500 mx-auto mb-1" />
          <div className="text-lg font-bold text-white">{battleStats.losses}</div>
          <div className="text-xs text-dark-400">Przegrane</div>
        </Card>
        <Card padding="sm" className="text-center">
          <Target className="w-5 h-5 text-blue-500 mx-auto mb-1" />
          <div className="text-lg font-bold text-white">{battleStats.draws}</div>
          <div className="text-xs text-dark-400">Remisy</div>
        </Card>
      </div>

      {/* Challenge limit info */}
      <Card padding="sm" className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-turbo-500" />
          <span className="text-dark-300">Wyzwania w tym tygodniu:</span>
        </div>
        <span className={`font-bold ${challengesSentThisWeek >= 3 ? 'text-red-400' : 'text-turbo-400'}`}>
          {challengesSentThisWeek}/3
        </span>
      </Card>

      {/* Tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => setActiveTab('challenges')}
          className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-3 rounded-xl font-medium transition-colors relative ${
            activeTab === 'challenges'
              ? 'bg-orange-500 text-white'
              : 'bg-dark-700 text-dark-300 hover:bg-dark-600'
          }`}
        >
          <Swords className="w-4 h-4" />
          <span className="text-sm">Wyzwania</span>
          {incomingChallenges.length > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-xs flex items-center justify-center text-white">
              {incomingChallenges.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('my_battles')}
          className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-3 rounded-xl font-medium transition-colors ${
            activeTab === 'my_battles'
              ? 'bg-orange-500 text-white'
              : 'bg-dark-700 text-dark-300 hover:bg-dark-600'
          }`}
        >
          <Trophy className="w-4 h-4" />
          <span className="text-sm">Historia</span>
        </button>
        <button
          onClick={() => {
            if (challengesSentThisWeek >= 3) {
              showError('Limit', 'Osiągnąłeś limit 3 wyzwań na tydzień');
              return;
            }
            setShowNewChallengeModal(true);
          }}
          className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-3 rounded-xl font-medium transition-colors ${
            challengesSentThisWeek >= 3
              ? 'bg-dark-700 text-dark-500 cursor-not-allowed'
              : 'bg-turbo-500 text-white hover:bg-turbo-600'
          }`}
        >
          <Users className="w-4 h-4" />
          <span className="text-sm">Wyzwij</span>
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <Card key={i} className="h-24 animate-pulse bg-dark-700" />
          ))}
        </div>
      ) : activeTab === 'challenges' ? (
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
              <Card key={battle.id} className="border-orange-500/30">
                <div className="flex items-center gap-3 mb-3">
                  <Avatar
                    src={battle.challenger?.avatar_url}
                    fallback={battle.challenger?.nick || '?'}
                    size="md"
                  />
                  <div className="flex-1">
                    <p className="font-medium text-white">{battle.challenger?.nick}</p>
                    <p className="text-sm text-orange-400">
                      Wyzwanie: {getCategoryIcon(battle.category)} {getCategoryName(battle.category)}
                    </p>
                  </div>
                  <Badge variant={battle.reward_type === 'cards' ? 'danger' : 'turbo'}>
                    {battle.reward_type === 'cards' ? '🃏 Na karty' : '⚡ Na XP'}
                  </Badge>
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
                    onClick={() => {
                      setSelectedBattleId(battle.id);
                      setSelectedCards([]);
                      setShowAcceptModal(true);
                    }}
                  >
                    <Check className="w-4 h-4 mr-1" />
                    Akceptuj
                  </Button>
                </div>
              </Card>
            ))
          )}
        </div>
      ) : (
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
                    setShowBattleDetailModal(true);
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
                        {getCategoryIcon(battle.category)} {getCategoryName(battle.category)}
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

      {/* Mystery Garage Promo */}
      <Link href="/mystery">
        <Card className="border-emerald-500/30 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 hover:from-emerald-500/20 hover:to-teal-500/20 transition-all">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
              <Gift className="w-7 h-7 text-emerald-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-white">Nie masz kart?</p>
              <p className="text-sm text-emerald-400">
                Otwórz pakiet w Mystery Garage i zdobądź losowe karty!
              </p>
            </div>
            <ChevronRight className="w-5 h-5 text-emerald-400 flex-shrink-0" />
          </div>
        </Card>
      </Link>

      {/* New Challenge Modal */}
      <Modal
        isOpen={showNewChallengeModal}
        onClose={() => {
          setShowNewChallengeModal(false);
          resetNewChallengeState();
        }}
        title="Nowe wyzwanie"
      >
        <div className="space-y-4">
          {/* Step 1: Select opponent */}
          {!selectedOpponent ? (
            <>
              <p className="text-dark-400 text-sm">Wybierz przeciwnika:</p>
              <div className="max-h-64 overflow-y-auto space-y-2">
                {availablePlayers.length === 0 ? (
                  <p className="text-center text-dark-500 py-4">
                    Brak graczy z wystarczającą liczbą kart
                  </p>
                ) : (
                  availablePlayers.map(player => (
                    <button
                      key={player.id}
                      onClick={() => setSelectedOpponent(player)}
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
          ) : selectedCards.length < 2 ? (
            <>
              {/* Step 2: Select cards */}
              <div className="flex items-center gap-2 mb-2">
                <Avatar src={selectedOpponent.avatar_url} fallback={selectedOpponent.nick} size="sm" />
                <span className="text-white font-medium">{selectedOpponent.nick}</span>
                <button
                  onClick={() => setSelectedOpponent(null)}
                  className="text-dark-400 text-sm hover:text-white"
                >
                  (zmień)
                </button>
              </div>

              <p className="text-dark-400 text-sm">Wybierz minimum 2 karty ({selectedCards.length}/2+):</p>

              <div className="max-h-64 overflow-y-auto space-y-2">
                {myCars.length < 2 ? (
                  <div className="text-center py-4">
                    <AlertCircle className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
                    <p className="text-dark-400 mb-3">Potrzebujesz minimum 2 kart samochodów</p>
                    <Link
                      href="/mystery"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-xl transition-colors"
                      onClick={() => setShowNewChallengeModal(false)}
                    >
                      <Package className="w-5 h-5" />
                      Zdobądź karty w Mystery Garage
                    </Link>
                  </div>
                ) : (
                  myCars.map(card => (
                    <button
                      key={card.id}
                      onClick={() => toggleCardSelection(card.id)}
                      className={`w-full flex items-center gap-3 p-3 rounded-xl transition-colors ${
                        selectedCards.includes(card.id)
                          ? 'bg-turbo-500/20 border border-turbo-500'
                          : 'bg-dark-700 hover:bg-dark-600'
                      }`}
                    >
                      <div className="w-12 h-8 bg-dark-600 rounded overflow-hidden">
                        {card.image_url && (
                          <img src={card.image_url} alt={card.name} className="w-full h-full object-cover" />
                        )}
                      </div>
                      <div className="flex-1 text-left">
                        <p className="font-medium text-white text-sm">{card.name}</p>
                        <p className="text-xs text-dark-400">
                          {card.car_horsepower}HP • {card.car_torque}Nm • {card.car_max_speed}km/h
                        </p>
                      </div>
                      {selectedCards.includes(card.id) && (
                        <Check className="w-5 h-5 text-turbo-400" />
                      )}
                    </button>
                  ))
                )}
              </div>

              {selectedCards.length >= 2 && (
                <Button fullWidth onClick={() => {}}>
                  Dalej
                </Button>
              )}
            </>
          ) : (
            <>
              {/* Step 3: Select category and reward */}
              <div className="flex items-center gap-2 mb-2">
                <Avatar src={selectedOpponent.avatar_url} fallback={selectedOpponent.nick} size="sm" />
                <span className="text-white font-medium">{selectedOpponent.nick}</span>
              </div>

              <p className="text-dark-400 text-sm mb-2">Wybrane karty: {selectedCards.length}</p>

              <div className="space-y-3">
                <div>
                  <p className="text-dark-400 text-sm mb-2">Kategoria bitwy:</p>
                  <div className="grid grid-cols-2 gap-2">
                    {(['power', 'torque', 'speed', 'total'] as BattleCategory[]).map(cat => (
                      <button
                        key={cat}
                        onClick={() => setSelectedCategory(cat)}
                        className={`p-3 rounded-xl text-sm font-medium transition-colors ${
                          selectedCategory === cat
                            ? 'bg-orange-500 text-white'
                            : 'bg-dark-700 text-dark-300 hover:bg-dark-600'
                        }`}
                      >
                        {getCategoryIcon(cat)} {getCategoryName(cat)}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-dark-400 text-sm mb-2">Nagroda:</p>
                  <div className="p-3 rounded-xl bg-turbo-500/20 border border-turbo-500/30">
                    <p className="text-turbo-400 font-medium text-sm">⚡ Punkty XP</p>
                    <p className="text-xs text-dark-400 mt-1">
                      Zwycięzca: +100 XP • Przegrany: +20 XP
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  variant="secondary"
                  className="flex-1"
                  onClick={() => setSelectedCards([])}
                >
                  Wróć
                </Button>
                <Button
                  className="flex-1"
                  loading={isSubmitting}
                  onClick={handleCreateChallenge}
                >
                  Wyślij wyzwanie
                </Button>
              </div>
            </>
          )}
        </div>
      </Modal>

      {/* Accept Challenge Modal */}
      <Modal
        isOpen={showAcceptModal}
        onClose={() => {
          setShowAcceptModal(false);
          setSelectedBattleId(null);
          setSelectedCards([]);
        }}
        title="Akceptuj wyzwanie"
      >
        {selectedBattle && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-dark-700 rounded-xl">
              <Avatar
                src={selectedBattle.challenger?.avatar_url}
                fallback={selectedBattle.challenger?.nick || '?'}
                size="md"
              />
              <div>
                <p className="font-medium text-white">{selectedBattle.challenger?.nick}</p>
                <p className="text-sm text-orange-400">
                  {getCategoryIcon(selectedBattle.category)} {getCategoryName(selectedBattle.category)}
                </p>
              </div>
              <Badge variant={selectedBattle.reward_type === 'cards' ? 'danger' : 'turbo'} className="ml-auto">
                {selectedBattle.reward_type === 'cards' ? '🃏 Na karty' : '⚡ Na XP'}
              </Badge>
            </div>

            <div className="flex justify-center gap-4">
              <div className="text-center">
                <div className="w-16 h-12 bg-dark-600 rounded-lg flex items-center justify-center text-2xl mb-1">
                  ?
                </div>
                <p className="text-xs text-dark-400">Karta 1</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-12 bg-dark-600 rounded-lg flex items-center justify-center text-2xl mb-1">
                  ?
                </div>
                <p className="text-xs text-dark-400">Karta 2</p>
              </div>
            </div>

            <p className="text-dark-400 text-sm">Wybierz swoje karty ({selectedCards.length}/2+):</p>

            <div className="max-h-48 overflow-y-auto space-y-2">
              {myCars.map(card => (
                <button
                  key={card.id}
                  onClick={() => toggleCardSelection(card.id)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl transition-colors ${
                    selectedCards.includes(card.id)
                      ? 'bg-turbo-500/20 border border-turbo-500'
                      : 'bg-dark-700 hover:bg-dark-600'
                  }`}
                >
                  <div className="w-12 h-8 bg-dark-600 rounded overflow-hidden">
                    {card.image_url && (
                      <img src={card.image_url} alt={card.name} className="w-full h-full object-cover" />
                    )}
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-medium text-white text-sm">{card.name}</p>
                    <p className="text-xs text-dark-400">
                      {card.car_horsepower}HP • {card.car_torque}Nm • {card.car_max_speed}km/h
                    </p>
                  </div>
                  {selectedCards.includes(card.id) && (
                    <Check className="w-5 h-5 text-turbo-400" />
                  )}
                </button>
              ))}
            </div>

            {selectedRewardType === 'cards' && (
              <p className="text-xs text-red-400">
                ⚠️ Jeśli przegrasz, stracisz wybrane karty!
              </p>
            )}

            <Button
              fullWidth
              loading={isSubmitting}
              disabled={selectedCards.length < 2}
              onClick={handleAcceptChallenge}
            >
              Walcz! ({selectedCards.length}/2 kart)
            </Button>
          </div>
        )}
      </Modal>

      {/* Battle Detail Modal */}
      <Modal
        isOpen={showBattleDetailModal}
        onClose={() => {
          setShowBattleDetailModal(false);
          setDetailBattle(null);
        }}
        title="Szczegóły bitwy"
      >
        {detailBattle && (() => {
          const iAmChallenger = detailBattle.challenger_id === profile.id;
          const myData = iAmChallenger
            ? { user: detailBattle.challenger, cards: detailBattle.challenger_cards || [], score: detailBattle.challenger_score }
            : { user: detailBattle.opponent, cards: detailBattle.opponent_cards || [], score: detailBattle.opponent_score };
          const theirData = iAmChallenger
            ? { user: detailBattle.opponent, cards: detailBattle.opponent_cards || [], score: detailBattle.opponent_score }
            : { user: detailBattle.challenger, cards: detailBattle.challenger_cards || [], score: detailBattle.challenger_score };
          const isWinner = detailBattle.winner_id === profile.id;
          const isDraw = !detailBattle.winner_id;
          const scoreDiff = Math.abs((myData.score || 0) - (theirData.score || 0));

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
                {!isDraw && (
                  <p className="text-sm text-dark-300">
                    Roznica: {scoreDiff} pkt
                  </p>
                )}
              </div>

              {/* Category & date */}
              <div className="flex items-center justify-between text-sm text-dark-400">
                <span>{getCategoryIcon(detailBattle.category)} {getCategoryName(detailBattle.category)}</span>
                <span>{detailBattle.completed_at ? new Date(detailBattle.completed_at).toLocaleDateString('pl-PL') : ''}</span>
              </div>

              {/* Score comparison */}
              <div className="flex items-center gap-3">
                <div className="flex-1 text-center">
                  <Avatar src={myData.user?.avatar_url} fallback={myData.user?.nick || '?'} size="md" />
                  <p className="text-sm font-medium text-white mt-1">{myData.user?.nick || 'Ty'}</p>
                  <p className={`text-2xl font-bold mt-1 ${isDraw ? 'text-blue-400' : isWinner ? 'text-green-400' : 'text-red-400'}`}>
                    {myData.score || 0}
                  </p>
                </div>
                <div className="text-dark-500 font-bold text-lg">VS</div>
                <div className="flex-1 text-center">
                  <Avatar src={theirData.user?.avatar_url} fallback={theirData.user?.nick || '?'} size="md" />
                  <p className="text-sm font-medium text-white mt-1">{theirData.user?.nick || 'Przeciwnik'}</p>
                  <p className={`text-2xl font-bold mt-1 ${isDraw ? 'text-blue-400' : !isWinner ? 'text-green-400' : 'text-red-400'}`}>
                    {theirData.score || 0}
                  </p>
                </div>
              </div>

              {/* My cards */}
              <div>
                <p className="text-sm font-medium text-dark-300 mb-2">Twoje karty:</p>
                <div className="space-y-2">
                  {myData.cards.map(card => (
                    <div key={card.id} className="flex items-center gap-3 p-2 bg-dark-700 rounded-xl">
                      <div className="w-14 h-10 bg-dark-600 rounded-lg overflow-hidden flex-shrink-0">
                        {card.image_url && (
                          <img src={card.image_url} alt={card.name} className="w-full h-full object-cover" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-white text-sm truncate">{card.name}</p>
                        <div className="flex gap-3 text-xs text-dark-400">
                          {detailBattle.category === 'power' || detailBattle.category === 'total' ? (
                            <span className={detailBattle.category === 'power' ? 'text-orange-400 font-medium' : ''}>{card.car_horsepower} KM</span>
                          ) : null}
                          {detailBattle.category === 'torque' || detailBattle.category === 'total' ? (
                            <span className={detailBattle.category === 'torque' ? 'text-orange-400 font-medium' : ''}>{card.car_torque} Nm</span>
                          ) : null}
                          {detailBattle.category === 'speed' || detailBattle.category === 'total' ? (
                            <span className={detailBattle.category === 'speed' ? 'text-orange-400 font-medium' : ''}>{card.car_max_speed} km/h</span>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Their cards */}
              <div>
                <p className="text-sm font-medium text-dark-300 mb-2">Karty przeciwnika:</p>
                <div className="space-y-2">
                  {theirData.cards.map(card => (
                    <div key={card.id} className="flex items-center gap-3 p-2 bg-dark-700 rounded-xl">
                      <div className="w-14 h-10 bg-dark-600 rounded-lg overflow-hidden flex-shrink-0">
                        {card.image_url && (
                          <img src={card.image_url} alt={card.name} className="w-full h-full object-cover" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-white text-sm truncate">{card.name}</p>
                        <div className="flex gap-3 text-xs text-dark-400">
                          {detailBattle.category === 'power' || detailBattle.category === 'total' ? (
                            <span className={detailBattle.category === 'power' ? 'text-orange-400 font-medium' : ''}>{card.car_horsepower} KM</span>
                          ) : null}
                          {detailBattle.category === 'torque' || detailBattle.category === 'total' ? (
                            <span className={detailBattle.category === 'torque' ? 'text-orange-400 font-medium' : ''}>{card.car_torque} Nm</span>
                          ) : null}
                          {detailBattle.category === 'speed' || detailBattle.category === 'total' ? (
                            <span className={detailBattle.category === 'speed' ? 'text-orange-400 font-medium' : ''}>{card.car_max_speed} km/h</span>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Reward info */}
              <div className="text-center text-sm text-dark-400 pt-2 border-t border-dark-700">
                {detailBattle.reward_type === 'xp' ? (
                  isWinner ? 'Nagroda: +100 XP' : isDraw ? 'Remis - brak nagrody XP' : 'Przegrana: +20 XP za udział'
                ) : (
                  isWinner ? 'Nagroda: karty przeciwnika' : isDraw ? 'Remis - karty zwrócone' : 'Strata: Twoje karty przeszły do zwycięzcy'
                )}
              </div>
            </div>
          );
        })()}
      </Modal>
    </div>
  );
}
