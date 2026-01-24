'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Card } from '@/components/ui';
import { Reward } from '@/types';
import { Trophy, Gift, Star, Crown, Medal, Award, Heart, Zap } from 'lucide-react';

// Domyślne nagrody za Ranking XP
const DEFAULT_XP_REWARDS: Reward[] = [
  {
    id: 'xp-1',
    place: 1,
    title: 'Nagroda główna XP',
    description: 'Opis nagrody za 1. miejsce w rankingu XP',
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 'xp-2',
    place: 2,
    title: 'Nagroda za 2. miejsce',
    description: 'Opis nagrody za 2. miejsce w rankingu XP',
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 'xp-3',
    place: 3,
    title: 'Nagroda za 3. miejsce',
    description: 'Opis nagrody za 3. miejsce w rankingu XP',
    is_active: true,
    created_at: new Date().toISOString(),
  },
];

// Domyślne nagrody za Ranking Wsparcia
const DEFAULT_DONATION_REWARDS: Reward[] = [
  {
    id: 'don-1',
    place: 1,
    title: 'Top Wspierający',
    description: 'Specjalna nagroda dla największego wspierającego Turbo Pomoc',
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 'don-2',
    place: 2,
    title: 'Srebrny Wspierający',
    description: 'Nagroda za 2. miejsce w rankingu wsparcia',
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 'don-3',
    place: 3,
    title: 'Brązowy Wspierający',
    description: 'Nagroda za 3. miejsce w rankingu wsparcia',
    is_active: true,
    created_at: new Date().toISOString(),
  },
];

const placeConfig = [
  {
    place: 1,
    icon: Crown,
    gradient: 'from-yellow-400 via-yellow-500 to-amber-600',
    bgGlow: 'shadow-yellow-500/30',
    textColor: 'text-yellow-400',
    borderColor: 'border-yellow-500/50',
    label: '1. MIEJSCE',
    size: 'large',
  },
  {
    place: 2,
    icon: Medal,
    gradient: 'from-gray-300 via-gray-400 to-gray-500',
    bgGlow: 'shadow-gray-400/20',
    textColor: 'text-gray-300',
    borderColor: 'border-gray-400/50',
    label: '2. MIEJSCE',
    size: 'medium',
  },
  {
    place: 3,
    icon: Award,
    gradient: 'from-amber-600 via-amber-700 to-orange-800',
    bgGlow: 'shadow-amber-600/20',
    textColor: 'text-amber-500',
    borderColor: 'border-amber-600/50',
    label: '3. MIEJSCE',
    size: 'medium',
  },
];

export default function RewardsPage() {
  const [xpRewards, setXpRewards] = useState<Reward[]>([]);
  const [donationRewards, setDonationRewards] = useState<Reward[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRewards();
  }, []);

  const fetchRewards = async () => {
    // Pobierz nagrody XP (reward_type = 'xp' lub brak typu = XP)
    const { data: xpData, error: xpError } = await supabase
      .from('rewards')
      .select('*')
      .eq('is_active', true)
      .or('reward_type.eq.xp,reward_type.is.null')
      .order('place', { ascending: true });

    if (!xpError && xpData && xpData.length > 0) {
      setXpRewards(xpData as Reward[]);
    } else {
      setXpRewards(DEFAULT_XP_REWARDS);
    }

    // Pobierz nagrody za wsparcie (reward_type = 'donation')
    const { data: donationData, error: donationError } = await supabase
      .from('rewards')
      .select('*')
      .eq('is_active', true)
      .eq('reward_type', 'donation')
      .order('place', { ascending: true });

    if (!donationError && donationData && donationData.length > 0) {
      setDonationRewards(donationData as Reward[]);
    } else {
      setDonationRewards(DEFAULT_DONATION_REWARDS);
    }

    setLoading(false);
  };

  const getPlaceConfig = (place: number) => {
    return placeConfig.find(p => p.place === place) || placeConfig[2];
  };

  if (loading) {
    return (
      <div className="min-h-screen p-4 pb-24">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-dark-700 rounded w-1/3 mx-auto" />
          <div className="h-64 bg-dark-700 rounded-2xl" />
          <div className="h-48 bg-dark-700 rounded-2xl" />
          <div className="h-48 bg-dark-700 rounded-2xl" />
        </div>
      </div>
    );
  }

  // Komponent do renderowania sekcji nagród
  const renderRewardSection = (rewards: Reward[], type: 'xp' | 'donation') => {
    const mainReward = rewards.find(r => r.place === 1);
    const otherRewards = rewards.filter(r => r.place > 1).slice(0, 2);
    const isXp = type === 'xp';

    return (
      <div className="space-y-4">
        {/* Główna nagroda - 1. miejsce */}
        {mainReward && (
          <div className="relative">
            <div className={`absolute -inset-1 bg-gradient-to-r ${isXp ? 'from-yellow-400 via-amber-500 to-yellow-400' : 'from-red-400 via-pink-500 to-red-400'} rounded-3xl blur-lg opacity-30 animate-pulse`} />
            <Card className={`relative overflow-hidden border-2 ${isXp ? 'border-yellow-500/50' : 'border-red-500/50'}`}>
              {/* Shine effect */}
              <div className={`absolute inset-0 bg-gradient-to-br ${isXp ? 'from-yellow-500/10 via-transparent to-amber-500/10' : 'from-red-500/10 via-transparent to-pink-500/10'}`} />

              {/* Badge */}
              <div className="absolute top-4 right-4">
                <div className={`flex items-center gap-1 px-3 py-1 rounded-full bg-gradient-to-r ${isXp ? 'from-yellow-400 to-amber-500' : 'from-red-400 to-pink-500'} text-white text-xs font-bold`}>
                  {isXp ? <Crown className="w-3 h-3" /> : <Heart className="w-3 h-3" />}
                  1. MIEJSCE
                </div>
              </div>

              <div className="relative p-6">
                {/* Icon */}
                <div className="flex justify-center mb-4">
                  <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${isXp ? 'from-yellow-400 via-yellow-500 to-amber-600 shadow-yellow-500/30' : 'from-red-400 via-red-500 to-pink-600 shadow-red-500/30'} flex items-center justify-center shadow-xl`}>
                    <Gift className="w-10 h-10 text-white" />
                  </div>
                </div>

                {/* Content */}
                <div className="text-center">
                  <h2 className="text-xl font-bold text-white mb-2">{mainReward.title}</h2>
                  <p className="text-dark-300 mb-3">{mainReward.description}</p>

                  {mainReward.value && (
                    <div className={`inline-block px-4 py-2 rounded-xl ${isXp ? 'bg-yellow-500/20 border-yellow-500/30' : 'bg-red-500/20 border-red-500/30'} border`}>
                      <span className={`${isXp ? 'text-yellow-400' : 'text-red-400'} font-bold text-lg`}>{mainReward.value}</span>
                    </div>
                  )}

                  {mainReward.sponsor && (
                    <p className="text-xs text-dark-500 mt-3">
                      Sponsor: <span className="text-dark-400">{mainReward.sponsor}</span>
                    </p>
                  )}
                </div>

                {/* Image */}
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

        {/* 2. i 3. miejsce */}
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
                    {/* Badge */}
                    <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gradient-to-r ${config.gradient} text-white text-xs font-bold mb-3`}>
                      <Icon className="w-3 h-3" />
                      {config.label}
                    </div>

                    {/* Icon */}
                    <div className="flex justify-center mb-3">
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${config.gradient} flex items-center justify-center shadow-lg ${config.bgGlow}`}>
                        <Gift className="w-6 h-6 text-white" />
                      </div>
                    </div>

                    {/* Content */}
                    <div className="text-center">
                      <h3 className="font-bold text-white text-sm mb-1 line-clamp-2">{reward.title}</h3>
                      <p className="text-dark-400 text-xs line-clamp-2">{reward.description}</p>

                      {reward.value && (
                        <div className={`mt-2 ${config.textColor} font-bold text-sm`}>
                          {reward.value}
                        </div>
                      )}
                    </div>

                    {/* Image */}
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
        {/* === SEKCJA 1: Nagrody za Ranking XP === */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-turbo-500/20 flex items-center justify-center">
              <Zap className="w-4 h-4 text-turbo-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Ranking XP</h2>
              <p className="text-xs text-dark-400">Za wykonywanie misji i aktywność</p>
            </div>
          </div>
          {renderRewardSection(xpRewards, 'xp')}
        </div>

        {/* Separator */}
        <div className="flex items-center gap-4 py-2">
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-dark-600 to-transparent" />
          <span className="text-dark-500 text-sm">oraz</span>
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-dark-600 to-transparent" />
        </div>

        {/* === SEKCJA 2: Nagrody za Wsparcie === */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-red-500/20 flex items-center justify-center">
              <Heart className="w-4 h-4 text-red-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Ranking Wsparcia</h2>
              <p className="text-xs text-dark-400">Za zakup kart i wsparcie Turbo Pomoc</p>
            </div>
          </div>
          {renderRewardSection(donationRewards, 'donation')}
        </div>

        {/* Info section */}
        <div className="space-y-3">
          <Card variant="outlined" className="border-turbo-500/30 bg-turbo-500/5">
            <div className="flex items-start gap-3 p-4">
              <Zap className="w-5 h-5 text-turbo-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-turbo-400 font-medium text-sm">Jak zdobyć nagrody XP?</p>
                <p className="text-dark-300 text-sm mt-1">
                  Zbieraj punkty XP wykonując misje i wspinaj się w rankingu.
                </p>
              </div>
            </div>
          </Card>

          <Card variant="outlined" className="border-red-500/30 bg-red-500/5">
            <div className="flex items-start gap-3 p-4">
              <Heart className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-red-400 font-medium text-sm">Jak zdobyć nagrody za Wsparcie?</p>
                <p className="text-dark-300 text-sm mt-1">
                  Kupuj karty kolekcjonerskie i wspieraj Turbo Pomoc. Im więcej wpłacisz, tym wyżej w rankingu!
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
