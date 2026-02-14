'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { Card } from '@/components/ui';
import { SkeletonCard } from '@/components/ui/Skeleton';
import { Reward } from '@/types';
import { Trophy, Gift, Crown, Medal, Award, Heart, Zap, Sparkles, Layers, ChevronRight } from 'lucide-react';

const placeConfig = [
  {
    place: 1,
    icon: Crown,
    gradient: 'from-yellow-400 via-yellow-500 to-amber-600',
    bgGlow: 'shadow-yellow-500/30',
    textColor: 'text-yellow-400',
    borderColor: 'border-yellow-500/50',
    label: '1. MIEJSCE',
  },
  {
    place: 2,
    icon: Medal,
    gradient: 'from-gray-300 via-gray-400 to-gray-500',
    bgGlow: 'shadow-gray-400/20',
    textColor: 'text-gray-300',
    borderColor: 'border-gray-400/50',
    label: '2. MIEJSCE',
  },
  {
    place: 3,
    icon: Award,
    gradient: 'from-amber-600 via-amber-700 to-orange-800',
    bgGlow: 'shadow-amber-600/20',
    textColor: 'text-amber-500',
    borderColor: 'border-amber-600/50',
    label: '3. MIEJSCE',
  },
];

export default function RewardsPage() {
  const [xpRewards, setXpRewards] = useState<Reward[]>([]);
  const [cardsRewards, setCardsRewards] = useState<Reward[]>([]);
  const [lotteryRewards, setLotteryRewards] = useState<Reward[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRewards();
  }, []);

  const fetchRewards = async () => {
    const { data, error } = await supabase
      .from('rewards')
      .select('*')
      .eq('is_active', true)
      .order('place', { ascending: true });

    if (!error && data) {
      const all = data as Reward[];
      setXpRewards(all.filter(r => r.reward_type === 'xp' || !r.reward_type));
      setCardsRewards(all.filter(r => r.reward_type === 'cards' || (r.reward_type as string) === 'donation'));
      setLotteryRewards(all.filter(r => r.reward_type === 'lottery'));
    }

    setLoading(false);
  };

  const getPlaceConfig = (place: number) => {
    return placeConfig.find(p => p.place === place) || placeConfig[2];
  };

  if (loading) {
    return (
      <div className="min-h-screen p-4 pb-24">
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </div>
    );
  }

  const renderRewardSection = (rewards: Reward[], colorScheme: 'xp' | 'cards') => {
    const mainReward = rewards.find(r => r.place === 1);
    const otherRewards = rewards.filter(r => r.place > 1 && r.place <= 3);
    const isXp = colorScheme === 'xp';

    if (rewards.length === 0) {
      return (
        <Card variant="outlined" className="text-center py-8">
          <Gift className="w-10 h-10 text-dark-600 mx-auto mb-2" />
          <p className="text-dark-400 text-sm">Nagrody zostaną ogłoszone wkrótce</p>
        </Card>
      );
    }

    return (
      <div className="space-y-4">
        {mainReward && (
          <div className="relative">
            <div className={`absolute -inset-1 bg-gradient-to-r ${isXp ? 'from-yellow-400 via-amber-500 to-yellow-400' : 'from-red-400 via-pink-500 to-red-400'} rounded-3xl blur-lg opacity-30 animate-pulse`} />
            <Card className={`relative overflow-hidden border-2 ${isXp ? 'border-yellow-500/50' : 'border-red-500/50'}`}>
              <div className={`absolute inset-0 bg-gradient-to-br ${isXp ? 'from-yellow-500/10 via-transparent to-amber-500/10' : 'from-red-500/10 via-transparent to-pink-500/10'}`} />

              <div className="absolute top-4 right-4">
                <div className={`flex items-center gap-1 px-3 py-1 rounded-full bg-gradient-to-r ${isXp ? 'from-yellow-400 to-amber-500' : 'from-red-400 to-pink-500'} text-white text-xs font-bold`}>
                  {isXp ? <Crown className="w-3 h-3" /> : <Heart className="w-3 h-3" />}
                  1. MIEJSCE
                </div>
              </div>

              <div className="relative p-6">
                <div className="flex justify-center mb-4">
                  <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${isXp ? 'from-yellow-400 via-yellow-500 to-amber-600 shadow-yellow-500/30' : 'from-red-400 via-red-500 to-pink-600 shadow-red-500/30'} flex items-center justify-center shadow-xl`}>
                    <Gift className="w-10 h-10 text-white" />
                  </div>
                </div>

                <div className="text-center">
                  <h2 className="text-xl font-bold text-white mb-2">{mainReward.title}</h2>
                  <p className="text-dark-300 mb-3">{mainReward.description}</p>

                  {mainReward.value && (
                    <div className={`inline-block px-4 py-2 rounded-xl ${isXp ? 'bg-yellow-500/20 border-yellow-500/30' : 'bg-red-500/20 border-red-500/30'} border`}>
                      <span className={`${isXp ? 'text-yellow-400' : 'text-red-400'} font-bold text-lg`}>{mainReward.value}</span>
                    </div>
                  )}

                  {mainReward.sponsor && (
                    <div className="flex items-center justify-center gap-1.5 mt-3">
                      <Award className="w-3.5 h-3.5 text-dark-400" />
                      <span className="text-sm text-dark-300">Sponsor: <span className="font-medium text-dark-200">{mainReward.sponsor}</span></span>
                    </div>
                  )}
                </div>

                {mainReward.image_url && (
                  <div className="mt-4 rounded-xl overflow-hidden">
                    <img
                      src={mainReward.image_url}
                      alt={mainReward.title}
                      className="w-full h-48 object-cover"
                    />
                  </div>
                )}
              </div>
            </Card>
          </div>
        )}

        {otherRewards.length > 0 && (
          <div className="grid grid-cols-2 gap-3">
            {otherRewards.map(reward => {
              const config = getPlaceConfig(reward.place);
              const Icon = config.icon;

              return (
                <Card
                  key={reward.id}
                  className={`relative overflow-hidden border ${config.borderColor}`}
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${config.gradient} opacity-5`} />

                  <div className="relative p-4">
                    <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gradient-to-r ${config.gradient} text-white text-xs font-bold mb-3`}>
                      <Icon className="w-3 h-3" />
                      {config.label}
                    </div>

                    <div className="flex justify-center mb-3">
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${config.gradient} flex items-center justify-center shadow-lg ${config.bgGlow}`}>
                        <Gift className="w-6 h-6 text-white" />
                      </div>
                    </div>

                    <div className="text-center">
                      <h3 className="font-bold text-white text-sm mb-1 line-clamp-2">{reward.title}</h3>
                      <p className="text-dark-400 text-xs line-clamp-2">{reward.description}</p>

                      {reward.value && (
                        <div className={`mt-2 ${config.textColor} font-bold text-sm`}>
                          {reward.value}
                        </div>
                      )}

                      {reward.sponsor && (
                        <div className="flex items-center justify-center gap-1 mt-2">
                          <Award className="w-3 h-3 text-dark-500" />
                          <span className="text-xs text-dark-400">{reward.sponsor}</span>
                        </div>
                      )}
                    </div>

                    {reward.image_url && (
                      <div className="mt-3 rounded-lg overflow-hidden">
                        <img
                          src={reward.image_url}
                          alt={reward.title}
                          className="w-full h-24 object-cover"
                        />
                      </div>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen pb-24">
      {/* Header */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-turbo-500/20 via-transparent to-transparent" />
        <div className="relative px-4 pt-8 pb-6 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-yellow-400 to-amber-600 shadow-lg shadow-yellow-500/30 mb-4">
            <Trophy className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Nagrody</h1>
          <p className="text-dark-400">Zobacz co możesz wygrać!</p>
        </div>
      </div>

      <div className="px-4 space-y-6">
        {/* === SEKCJA 1: Ranking Misji (XP) === */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-turbo-500/20 flex items-center justify-center">
              <Zap className="w-4 h-4 text-turbo-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Ranking Misji</h2>
              <p className="text-xs text-dark-400">Wykonuj misje, zdobywaj XP i walcz o nagrody!</p>
            </div>
          </div>
          {renderRewardSection(xpRewards, 'xp')}

          <Card variant="outlined" className="border-turbo-500/30 bg-turbo-500/5 mt-3">
            <div className="flex items-start gap-3 p-4">
              <Zap className="w-5 h-5 text-turbo-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-turbo-400 font-medium text-sm">Jak zdobyć?</p>
                <p className="text-dark-300 text-sm mt-1">
                  Realizuj misje, odpowiadaj na ankiety, skanuj kody QR i wspinaj się w rankingu XP.
                </p>
                <Link href="/leaderboard" className="inline-flex items-center gap-1 text-sm text-turbo-400 font-medium mt-2">
                  Zobacz ranking <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </Card>
        </div>

        {/* Separator */}
        <div className="flex items-center gap-4 py-2">
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-dark-600 to-transparent" />
          <span className="text-dark-500 text-sm">oraz</span>
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-dark-600 to-transparent" />
        </div>

        {/* === SEKCJA 2: Ranking Kart / Wsparcia === */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-red-500/20 flex items-center justify-center">
              <Layers className="w-4 h-4 text-red-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Ranking Kart i Wsparcia</h2>
              <p className="text-xs text-dark-400">Zbieraj karty, wspieraj cele charytatywne i wygrywaj!</p>
            </div>
          </div>
          {renderRewardSection(cardsRewards, 'cards')}

          <Card variant="outlined" className="border-red-500/30 bg-red-500/5 mt-3">
            <div className="flex items-start gap-3 p-4">
              <Heart className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-red-400 font-medium text-sm">Jak zdobyć?</p>
                <p className="text-dark-300 text-sm mt-1">
                  Kupuj karty kolekcjonerskie, wygrywaj bitwy w arenie i buduj kolekcję. Każdy zakup wspiera Turbo Pomoc!
                </p>
                <Link href="/leaderboard" className="inline-flex items-center gap-1 text-sm text-red-400 font-medium mt-2">
                  Zobacz ranking <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </Card>
        </div>

        {/* === SEKCJA 3: Losowania === */}
        {lotteryRewards.length > 0 && (
          <>
            <div className="flex items-center gap-4 py-2">
              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-dark-600 to-transparent" />
              <span className="text-dark-500 text-sm">bonus</span>
              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-dark-600 to-transparent" />
            </div>

            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">Losowania</h2>
                  <p className="text-xs text-dark-400">Dodatkowe szanse na nagrody dla aktywnych graczy!</p>
                </div>
              </div>

              <div className="space-y-3">
                {lotteryRewards.map(reward => (
                  <Card key={reward.id} className="border border-amber-500/30 overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 via-transparent to-yellow-500/5" />
                    <div className="relative p-4">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-yellow-600 flex items-center justify-center flex-shrink-0">
                          <Sparkles className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-white">{reward.title}</h3>
                          <p className="text-sm text-dark-300 mt-1">{reward.description}</p>

                          {reward.value && (
                            <div className="inline-block mt-2 px-3 py-1 rounded-lg bg-amber-500/20 border border-amber-500/30">
                              <span className="text-amber-400 font-bold text-sm">{reward.value}</span>
                            </div>
                          )}

                          {reward.sponsor && (
                            <div className="flex items-center gap-1.5 mt-2">
                              <Award className="w-3.5 h-3.5 text-dark-400" />
                              <span className="text-sm text-dark-300">Sponsor: <span className="font-medium text-dark-200">{reward.sponsor}</span></span>
                            </div>
                          )}
                        </div>
                      </div>

                      {reward.image_url && (
                        <div className="mt-3 rounded-lg overflow-hidden">
                          <img src={reward.image_url} alt={reward.title} className="w-full h-32 object-cover" />
                        </div>
                      )}
                    </div>
                  </Card>
                ))}
              </div>

              <Card variant="outlined" className="border-amber-500/30 bg-amber-500/5 mt-3">
                <div className="flex items-start gap-3 p-4">
                  <Sparkles className="w-5 h-5 text-amber-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-amber-400 font-medium text-sm">Jak wziąć udział?</p>
                    <p className="text-dark-300 text-sm mt-1">
                      Bądź aktywny w grze — im więcej XP i ukończonych misji, tym większa szansa na wylosowanie!
                    </p>
                  </div>
                </div>
              </Card>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
