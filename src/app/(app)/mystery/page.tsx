'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useMysteryPacks } from '@/hooks/useMysteryPacks';
import { Card, Button, Modal, Badge } from '@/components/ui';
import { SkeletonCard } from '@/components/ui/Skeleton';
import { useToast } from '@/components/ui/Toast';
import { CollectibleCardDisplay } from '@/components/cards';
import { RARITY_CONFIG } from '@/hooks/useCards';
import {
  Gift,
  Package,
  Sparkles,
  Heart,
  Clock,
  Copy,
  CheckCircle,
  Recycle,
  Zap,
  Star,
  Crown,
  Trophy,
  AlertCircle,
  Hexagon,
  Club,
  Flame,
} from 'lucide-react';
import { MysteryPackType, MysteryPackPurchase, CollectibleCard } from '@/types';

export default function MysteryGaragePage() {
  const { profile } = useAuth();
  const {
    packTypes,
    myPurchases,
    loading,
    purchasePack,
    recycleCard,
    getDuplicates,
  } = useMysteryPacks({ userId: profile?.id });
  const { success, error: showError } = useToast();

  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [selectedPack, setSelectedPack] = useState<MysteryPackType | null>(null);
  const [createdPurchase, setCreatedPurchase] = useState<MysteryPackPurchase | null>(null);
  const [purchasing, setPurchasing] = useState(false);
  const [copied, setCopied] = useState(false);

  const [showDuplicatesModal, setShowDuplicatesModal] = useState(false);
  const [duplicates, setDuplicates] = useState<{
    cardId: string;
    card: CollectibleCard;
    count: number;
    userCardIds: string[];
  }[]>([]);
  const [recycling, setRecycling] = useState<string | null>(null);

  // Załaduj duplikaty
  const loadDuplicates = async () => {
    const dupes = await getDuplicates();
    setDuplicates(dupes);
  };

  const handleBuyPack = (pack: MysteryPackType) => {
    setSelectedPack(pack);
    setCreatedPurchase(null);
    setShowPurchaseModal(true);
  };

  const handleCreateOrder = async () => {
    if (!selectedPack) return;

    setPurchasing(true);
    const { success: ok, error, purchase } = await purchasePack(selectedPack.id);
    setPurchasing(false);

    if (!ok) {
      showError('Błąd', error || 'Nie udało się utworzyć zamówienia');
      return;
    }

    if (purchase) {
      setCreatedPurchase(purchase);
    }
  };

  const copyOrderCode = () => {
    if (createdPurchase?.order_code) {
      navigator.clipboard.writeText(createdPurchase.order_code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleRecycle = async (userCardId: string) => {
    setRecycling(userCardId);
    const { success: ok, error, xpGained } = await recycleCard(userCardId);
    setRecycling(null);

    if (ok) {
      success('Karta oddana!', `Otrzymałeś +${xpGained} XP`);
      loadDuplicates();
    } else {
      showError('Błąd', error || 'Nie udało się oddać karty');
    }
  };

  const getPackIcon = (size: string, className = 'h-8 w-8') => {
    switch (size) {
      case 'small': return <Package className={`${className} text-slate-300`} />;
      case 'medium': return <Gift className={`${className} text-purple-300`} />;
      case 'large': return <Trophy className={`${className} text-yellow-300`} />;
      default: return <Package className={`${className} text-slate-300`} />;
    }
  };

  const getPackGradient = (size: string) => {
    switch (size) {
      case 'small': return 'from-slate-500 to-slate-600';
      case 'medium': return 'from-turbo-500 to-purple-500';
      case 'large': return 'from-yellow-500 to-orange-500';
      default: return 'from-slate-500 to-slate-600';
    }
  };

  // Oczekujące zamówienia
  const pendingPurchases = myPurchases.filter(p => p.status === 'pending');
  const completedPurchases = myPurchases.filter(p => p.status === 'opened');

  if (!profile) return null;

  return (
    <div className="py-6 pb-24">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <div className="w-14 h-14 rounded-xl bg-green-500/20 flex items-center justify-center flex-shrink-0">
          <Gift className="w-7 h-7 text-green-500" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Mystery Garage</h1>
          <p className="text-dark-400">Losowe pakiety kart - co wylosujesz?</p>
        </div>
      </div>

      {/* Info o charytatywnym celu */}
      <Card className="mb-6 border-red-500/30 bg-red-500/10">
        <div className="flex items-start gap-3">
          <Heart className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-red-400 font-medium">100% wpływa na Turbo Pomoc</p>
            <p className="text-sm text-red-400/70">
              Kupując pakiet wspierasz cel charytatywny i dostajesz losowe karty!
            </p>
          </div>
        </div>
      </Card>

      {/* Pakiety do kupienia */}
      <div className="space-y-4 mb-8">
        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
          <Package className="w-5 h-5 text-turbo-400" />
          Wybierz pakiet
        </h2>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : (
          <div className="grid gap-4">
            {packTypes.map(pack => (
              <Card
                key={pack.id}
                className={`relative overflow-hidden cursor-pointer hover:scale-[1.02] transition-transform border-2 ${
                  pack.size === 'large' ? 'border-yellow-500/50' :
                  pack.size === 'medium' ? 'border-turbo-500/50' : 'border-dark-600'
                }`}
                onClick={() => handleBuyPack(pack)}
              >
                {/* Gradient background */}
                <div className={`absolute inset-0 bg-gradient-to-r ${getPackGradient(pack.size)} opacity-10`} />

                <div className="relative flex items-center gap-4">
                  {/* Icon */}
                  <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${getPackGradient(pack.size)} flex items-center justify-center`}>
                    {getPackIcon(pack.size)}
                  </div>

                  {/* Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-white">{pack.name}</h3>
                      {pack.size === 'large' && (
                        <Badge variant="warning">
                          <Crown className="w-3 h-3 mr-1" />
                          BEST
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-dark-400">{pack.description}</p>

                    {/* Szanse */}
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs text-slate-400">{pack.common_chance}%</span>
                      <span className="text-xs text-green-400">{pack.rare_chance}%</span>
                      <span className="text-xs text-purple-400">{pack.epic_chance}%</span>
                      <span className="text-xs text-yellow-400">{pack.legendary_chance}%</span>
                    </div>
                  </div>

                  {/* Cena i ilość */}
                  <div className="text-right">
                    <div className="text-2xl font-bold text-white">{pack.price} zł</div>
                    <div className="text-sm text-dark-400">{pack.card_count} kart</div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Legenda rzadkości */}
      <Card className="mb-8">
        <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-yellow-400" />
          Rzadkość kart
        </h3>
        <div className="grid grid-cols-4 gap-2">
          {(['common', 'rare', 'epic', 'legendary'] as const).map(rarity => {
            const config = RARITY_CONFIG[rarity];
            return (
              <div key={rarity} className={`text-center p-2 rounded-lg ${config.bgColor}`}>
                <config.icon className={`w-5 h-5 mx-auto ${config.color}`} />
                <div className={`text-xs font-medium ${config.color} mt-1`}>{config.name}</div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Duplikaty do oddania */}
      <Card className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-white flex items-center gap-2">
            <Recycle className="w-5 h-5 text-green-400" />
            Oddaj duplikaty za XP
          </h3>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              loadDuplicates();
              setShowDuplicatesModal(true);
            }}
          >
            Sprawdź
          </Button>
        </div>
        <p className="text-sm text-dark-400">
          Masz zdublowane karty? Oddaj je z powrotem do systemu i otrzymaj XP!
        </p>
        <div className="flex items-center gap-4 mt-3 text-xs text-dark-500">
          <span>Common: +1 XP</span>
          <span>Rare: +2 XP</span>
          <span>Epic: +5 XP</span>
          <span>Legendary: +10 XP</span>
        </div>
      </Card>

      {/* Oczekujące zamówienia */}
      {pendingPurchases.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-yellow-400" />
            Oczekujące na płatność
          </h2>
          <div className="space-y-3">
            {pendingPurchases.map(purchase => (
              <Card key={purchase.id} className="border-yellow-500/30 bg-yellow-500/5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-white">
                      Pakiet {packTypes.find(p => p.id === purchase.pack_type_id)?.name}
                    </p>
                    <p className="text-sm text-dark-400">
                      Kod: <span className="font-mono text-yellow-400">{purchase.order_code}</span>
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-white">{purchase.amount} zł</p>
                    <Badge variant="warning">Oczekuje</Badge>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Historia otwartych pakietów */}
      {completedPurchases.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Gift className="w-5 h-5 text-green-400" />
            Otwarte pakiety
          </h2>
          <div className="space-y-3">
            {completedPurchases.slice(0, 5).map(purchase => (
              <Card key={purchase.id} className="border-green-500/30 bg-green-500/5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-white">
                      {packTypes.find(p => p.id === purchase.pack_type_id)?.name}
                    </p>
                    <p className="text-sm text-dark-400">
                      {new Date(purchase.opened_at!).toLocaleDateString('pl-PL')}
                    </p>
                  </div>
                  <div className="text-right">
                    <Badge variant="success">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      {purchase.cards_received?.length || 0} kart
                    </Badge>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Modal zakupu */}
      <Modal
        isOpen={showPurchaseModal}
        onClose={() => {
          setShowPurchaseModal(false);
          setSelectedPack(null);
          setCreatedPurchase(null);
        }}
        title={createdPurchase ? 'Instrukcja płatności' : 'Kup pakiet Mystery'}
      >
        {selectedPack && (
          <div className="space-y-4">
            {!createdPurchase ? (
              <>
                <div className={`p-4 rounded-xl bg-gradient-to-r ${getPackGradient(selectedPack.size)} bg-opacity-20`}>
                  <div className="flex items-center gap-4">
                    <div>{getPackIcon(selectedPack.size, 'h-10 w-10')}</div>
                    <div>
                      <h3 className="font-bold text-white text-lg">{selectedPack.name}</h3>
                      <p className="text-dark-300">{selectedPack.card_count} losowych kart</p>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-surface-2 rounded-xl">
                  <p className="text-sm text-dark-400 mb-2">Szanse na rzadkość:</p>
                  <div className="grid grid-cols-4 gap-2">
                    <div className="text-center">
                      <Hexagon className="w-5 h-5 mx-auto text-gray-400" />
                      <div className="text-xs text-slate-400 mt-1">{selectedPack.common_chance}%</div>
                    </div>
                    <div className="text-center">
                      <Club className="w-5 h-5 mx-auto text-blue-400" />
                      <div className="text-xs text-green-400 mt-1">{selectedPack.rare_chance}%</div>
                    </div>
                    <div className="text-center">
                      <Flame className="w-5 h-5 mx-auto text-purple-400" />
                      <div className="text-xs text-purple-400 mt-1">{selectedPack.epic_chance}%</div>
                    </div>
                    <div className="text-center">
                      <Crown className="w-5 h-5 mx-auto text-yellow-400" />
                      <div className="text-xs text-yellow-400 mt-1">{selectedPack.legendary_chance}%</div>
                    </div>
                  </div>
                </div>

                {selectedPack.size === 'large' && (
                  <div className="flex items-center gap-2 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-xl">
                    <Star className="w-5 h-5 text-yellow-400" />
                    <span className="text-sm text-yellow-400">Gwarantowana Epic lub lepsza karta!</span>
                  </div>
                )}

                <div className="border-t border-dark-700 pt-4">
                  <div className="flex justify-between mb-2">
                    <span className="text-dark-400">Wpłata na Turbo Pomoc:</span>
                    <span className="font-bold text-white text-xl">{selectedPack.price} zł</span>
                  </div>
                </div>

                <Button onClick={handleCreateOrder} loading={purchasing} fullWidth>
                  <Heart className="w-4 h-4 mr-2" />
                  Wesprzyj i kup pakiet
                </Button>
              </>
            ) : (
              <>
                <div className="text-center py-4">
                  <div className="w-16 h-16 rounded-full bg-turbo-500/20 flex items-center justify-center mx-auto mb-4">
                    <Gift className="w-8 h-8 text-turbo-500" />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">Zamówienie utworzone!</h3>
                  <p className="text-dark-400 text-sm">
                    Wykonaj przelew. Po zaksięgowaniu Twój pakiet zostanie automatycznie otwarty!
                  </p>
                </div>

                <div className="bg-surface-2 rounded-xl p-4 space-y-3">
                  <div>
                    <p className="text-xs text-dark-400 mb-1">Numer konta</p>
                    <p className="font-mono text-white">XX XXXX XXXX XXXX XXXX XXXX XXXX</p>
                    <p className="text-xs text-dark-500 mt-1">Fundacja Turbo Pomoc</p>
                  </div>

                  <div>
                    <p className="text-xs text-dark-400 mb-1">Kwota</p>
                    <p className="font-bold text-white text-xl">{createdPurchase.amount} zł</p>
                  </div>

                  <div>
                    <p className="text-xs text-dark-400 mb-1">Tytuł przelewu (ważne!)</p>
                    <div className="flex items-center gap-2">
                      <p className="font-mono font-bold text-turbo-400 text-lg flex-1">
                        {createdPurchase.order_code}
                      </p>
                      <button
                        onClick={copyOrderCode}
                        className="p-2 hover:bg-dark-600 rounded-lg transition-colors"
                      >
                        {copied ? (
                          <CheckCircle className="w-5 h-5 text-green-500" />
                        ) : (
                          <Copy className="w-5 h-5 text-dark-400" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-4">
                  <div className="flex items-start gap-2">
                    <Sparkles className="w-5 h-5 text-purple-400 mt-0.5" />
                    <div>
                      <p className="font-medium text-purple-400">Co dalej?</p>
                      <p className="text-sm text-purple-400/80">
                        Po zaksięgowaniu wpłaty pakiet zostanie automatycznie otwarty,
                        a wylosowane karty pojawią się w Twojej kolekcji!
                      </p>
                    </div>
                  </div>
                </div>

                <Button
                  variant="secondary"
                  onClick={() => {
                    setShowPurchaseModal(false);
                    setSelectedPack(null);
                    setCreatedPurchase(null);
                  }}
                  fullWidth
                >
                  Zamknij
                </Button>
              </>
            )}
          </div>
        )}
      </Modal>

      {/* Modal duplikatów */}
      <Modal
        isOpen={showDuplicatesModal}
        onClose={() => setShowDuplicatesModal(false)}
        title="Twoje duplikaty"
      >
        <div className="space-y-4">
          {duplicates.length === 0 ? (
            <div className="text-center py-8">
              <AlertCircle className="w-12 h-12 text-dark-500 mx-auto mb-3" />
              <p className="text-dark-400">Nie masz żadnych duplikatów</p>
              <p className="text-sm text-dark-500 mt-1">
                Kup pakiety Mystery, żeby mieć szansę na duplikaty!
              </p>
            </div>
          ) : (
            <>
              <p className="text-sm text-dark-400">
                Oddaj duplikaty, żeby zwolnić karty do puli i otrzymać XP.
                Zatrzymasz co najmniej 1 sztukę każdej karty.
              </p>

              <div className="space-y-3 max-h-96 overflow-y-auto">
                {duplicates.map(({ cardId, card, count, userCardIds }) => {
                  const config = RARITY_CONFIG[card.rarity];
                  const xpReward = card.rarity === 'legendary' ? 10 :
                                   card.rarity === 'epic' ? 5 :
                                   card.rarity === 'rare' ? 2 : 1;

                  return (
                    <div
                      key={cardId}
                      className="flex items-center gap-3 p-3 bg-surface-2 rounded-xl"
                    >
                      <div className="w-16 h-12 bg-dark-600 rounded overflow-hidden">
                        {card.image_url ? (
                          <img
                            src={card.image_url}
                            alt={card.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className={`w-full h-full ${config.bgColor} flex items-center justify-center`}>
                            <config.icon className={`w-5 h-5 ${config.color}`} />
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-white text-sm truncate">{card.name}</p>
                        <div className="flex items-center gap-2">
                          <Badge variant={
                            card.rarity === 'legendary' ? 'warning' :
                            card.rarity === 'epic' ? 'info' :
                            card.rarity === 'rare' ? 'success' : 'default'
                          } size="sm">
                            <config.icon className={`w-3 h-3 inline ${config.color}`} /> x{count}
                          </Badge>
                          <span className="text-xs text-dark-400">
                            +{xpReward} XP za oddanie
                          </span>
                        </div>
                      </div>

                      <Button
                        variant="secondary"
                        size="sm"
                        loading={recycling === userCardIds[0]}
                        onClick={() => handleRecycle(userCardIds[0])}
                      >
                        <Recycle className="w-4 h-4" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </Modal>
    </div>
  );
}
