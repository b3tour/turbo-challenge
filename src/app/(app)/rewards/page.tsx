'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Card } from '@/components/ui';
import { Reward } from '@/types';
import { Trophy, Gift, Star, Crown, Medal, Award } from 'lucide-react';

// Domyślne nagrody jeśli nie ma w bazie
const DEFAULT_REWARDS: Reward[] = [
  {
    id: '1',
    place: 1,
    title: 'Nagroda główna',
    description: 'Opis nagrody za 1. miejsce zostanie dodany przez administratora',
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: '2',
    place: 2,
    title: 'Nagroda za 2. miejsce',
    description: 'Opis nagrody za 2. miejsce zostanie dodany przez administratora',
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: '3',
    place: 3,
    title: 'Nagroda za 3. miejsce',
    description: 'Opis nagrody za 3. miejsce zostanie dodany przez administratora',
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
  const [rewards, setRewards] = useState<Reward[]>([]);
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

    if (!error && data && data.length > 0) {
      setRewards(data as Reward[]);
    } else {
      // Użyj domyślnych nagród
      setRewards(DEFAULT_REWARDS);
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

  const mainReward = rewards.find(r => r.place === 1);
  const otherRewards = rewards.filter(r => r.place > 1).slice(0, 2);

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

      <div className="px-4 space-y-4">
        {/* Główna nagroda - 1. miejsce */}
        {mainReward && (
          <div className="relative">
            <div className="absolute -inset-1 bg-gradient-to-r from-yellow-400 via-amber-500 to-yellow-400 rounded-3xl blur-lg opacity-30 animate-pulse" />
            <Card className={`relative overflow-hidden border-2 border-yellow-500/50`}>
              {/* Shine effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/10 via-transparent to-amber-500/10" />

              {/* Badge */}
              <div className="absolute top-4 right-4">
                <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-gradient-to-r from-yellow-400 to-amber-500 text-black text-xs font-bold">
                  <Crown className="w-3 h-3" />
                  1. MIEJSCE
                </div>
              </div>

              <div className="relative p-6">
                {/* Icon */}
                <div className="flex justify-center mb-4">
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-yellow-400 via-yellow-500 to-amber-600 flex items-center justify-center shadow-xl shadow-yellow-500/30">
                    <Gift className="w-10 h-10 text-white" />
                  </div>
                </div>

                {/* Content */}
                <div className="text-center">
                  <h2 className="text-xl font-bold text-white mb-2">{mainReward.title}</h2>
                  <p className="text-dark-300 mb-3">{mainReward.description}</p>

                  {mainReward.value && (
                    <div className="inline-block px-4 py-2 rounded-xl bg-yellow-500/20 border border-yellow-500/30">
                      <span className="text-yellow-400 font-bold text-lg">{mainReward.value}</span>
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

        {/* Info section */}
        <Card variant="outlined" className="border-turbo-500/30 bg-turbo-500/5">
          <div className="flex items-start gap-3 p-4">
            <Star className="w-5 h-5 text-turbo-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-turbo-400 font-medium text-sm">Jak zdobyć nagrody?</p>
              <p className="text-dark-300 text-sm mt-1">
                Zbieraj punkty XP wykonując misje i wspinaj się w rankingu.
                Na koniec gry TOP 3 graczy otrzyma nagrody!
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
