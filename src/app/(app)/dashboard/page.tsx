'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useMissions } from '@/hooks/useMissions';
import { useLeaderboard } from '@/hooks/useLeaderboard';
import { Card, ProgressBar, Avatar, AppInfoModal } from '@/components/ui';
import { MissionCard } from '@/components/missions';
import { formatNumber, missionTypeIcons } from '@/lib/utils';
import { useLevels } from '@/hooks/useLevels';
import {
  Target,
  Trophy,
  ChevronRight,
  Zap,
  Layers,
  Swords,
  Package,
  Gift,
  HelpCircle,
} from 'lucide-react';
import { useCards } from '@/hooks/useCards';
import { useBattles } from '@/hooks/useBattles';

export default function DashboardPage() {
  const router = useRouter();
  const { profile } = useAuth();
  const { missions, userSubmissions, loading: missionsLoading } = useMissions({
    userId: profile?.id,
    activeOnly: true,
  });
  const { getUserRank } = useLeaderboard({ limit: 5 });
  const { getCollectionStats } = useCards({ userId: profile?.id });
  const { calculateLevel, calculateLevelProgress, xpToNextLevel, getNextLevel } = useLevels();
  const { incomingChallenges } = useBattles({ userId: profile?.id });

  const [showAppInfo, setShowAppInfo] = useState(false);

  if (!profile) return null;

  // Synchronicznie pobierz ranking użytkownika z cache
  const userRank = getUserRank(profile.id);

  const level = calculateLevel(profile.total_xp);
  const progress = calculateLevelProgress(profile.total_xp);
  const xpNeeded = xpToNextLevel(profile.total_xp);
  const nextLevel = getNextLevel(level.id);

  // Misje które są już ukończone, oczekują na weryfikację lub nieukończone (nie pokazujemy ich jako dostępne)
  const busyMissionIds = userSubmissions
    .filter(s => s.status === 'approved' || s.status === 'pending' || s.status === 'failed')
    .map(s => s.mission_id);

  // Dostępne misje - tylko te bez zgłoszenia lub odrzucone/wycofane
  const availableMissions = missions
    .filter(m => !busyMissionIds.includes(m.id));

  // Top misje posortowane po XP (max 3)
  const topMissions = [...availableMissions]
    .sort((a, b) => (b.xp_reward || 0) - (a.xp_reward || 0))
    .slice(0, 3);

  // Kolekcja stats
  const collectionStats = getCollectionStats();

  return (
    <div className="space-y-6 py-4">
      {/* Welcome Card */}
      <Card variant="glass" className="relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-turbo-500/10 rounded-full blur-3xl" />

        <div className="flex items-center gap-4 mb-4">
          <Avatar
            src={profile.avatar_url}
            fallback={profile.nick}
            size="lg"
            showBorder
          />
          <div className="flex-1">
            <h1 className="text-xl font-bold text-white">{profile.nick}</h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-lg">{level.badge_icon}</span>
              <span className="text-dark-300">{level.name}</span>
            </div>
          </div>
          {userRank && (
            <div className="text-center">
              <div className="text-2xl font-bold text-turbo-400">#{userRank}</div>
              <div className="text-xs text-dark-400">Ranking</div>
            </div>
          )}
        </div>

        {/* XP Progress */}
        <div className="mb-3">
          <div className="flex justify-between text-sm mb-1">
            <span className="text-dark-400">Poziom {level.id}</span>
            <span className="text-turbo-400 font-medium">
              {formatNumber(profile.total_xp)} XP
            </span>
          </div>
          <ProgressBar value={progress} animated />
          <div className="flex justify-between text-xs mt-1">
            <span className="text-dark-500">
              {nextLevel ? `${formatNumber(xpNeeded)} XP do poziomu ${nextLevel.id}` : 'Maksymalny poziom!'}
            </span>
            <span className="text-dark-500">{progress}%</span>
          </div>
        </div>

        {/* Donation Progress - zawsze widoczny */}
        <div className="pt-3 border-t border-dark-700">
          <div className="flex justify-between text-sm mb-1">
            <span className="text-dark-400 flex items-center gap-1">
              <span className="text-base leading-none">❤️</span>
              Wsparcie Turbo Pomoc
            </span>
            <span className="text-red-400 font-medium">
              {(profile.donation_total || 0).toFixed(2)} zł
            </span>
          </div>
          <div className="h-2 bg-dark-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-red-500 to-pink-500 rounded-full transition-all"
              style={{ width: `${Math.min(100, ((profile.donation_total || 0) / 100) * 100)}%` }}
            />
          </div>
          <div className="text-xs text-dark-500 mt-1">
            {(profile.donation_total || 0) > 0
              ? 'Dziękujemy za Twój wkład!'
              : 'Kup kartę i wesprzyj fundację!'}
          </div>
        </div>
      </Card>

      {/* Available Missions */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Zap className="w-5 h-5 text-turbo-500" />
            Dostępne misje
            {availableMissions.length > 0 && (
              <span className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                <span className="text-[11px] font-bold text-white leading-none">{availableMissions.length}</span>
              </span>
            )}
          </h2>
          <Link
            href="/missions"
            className="text-sm text-accent-400 flex items-center px-2 py-1 -mr-2 rounded-lg active:bg-dark-700/50"
          >
            Zobacz wszystkie
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {missionsLoading ? (
          <Card className="h-20 animate-pulse bg-dark-700" />
        ) : availableMissions.length === 0 ? (
          <Card className="text-center py-6">
            <Target className="w-10 h-10 text-dark-600 mx-auto mb-2" />
            <p className="text-dark-400 text-sm">Gratulacje! Wszystkie misje ukończone.</p>
            <p className="text-dark-500 text-xs mt-1">Oczekuj na kolejne wyzwania!</p>
          </Card>
        ) : availableMissions.length === 1 ? (
          <MissionCard
            mission={topMissions[0]}
            compact
            onClick={() => router.push('/missions')}
          />
        ) : (
          <div className={`grid gap-3 ${topMissions.length === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
            {topMissions.map(mission => (
              <Card
                key={mission.id}
                hover
                onClick={() => router.push('/missions')}
                className="py-3 px-3 relative"
              >
                <span className="absolute top-2 right-2 text-[10px] font-bold text-turbo-400">
                  {formatNumber(mission.xp_reward)} XP
                </span>
                <div className="text-2xl mb-2">{missionTypeIcons[mission.type]}</div>
                <p className="text-sm font-medium text-white line-clamp-2">{mission.title}</p>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Kolekcja kart — uproszczony box */}
      <Link href="/cards" className="block">
        <Card className="py-4 px-4 border-purple-500/30 bg-gradient-to-b from-purple-500/10 to-transparent hover:border-purple-500/50 transition-colors">
          <div className="flex items-center gap-2 mb-2">
            <Layers className="w-6 h-6 text-purple-500" />
            <p className="text-sm font-semibold text-white">Kolekcja kart</p>
            <span className="text-sm font-bold text-purple-400 ml-auto">{collectionStats.collected}/{collectionStats.total}</span>
          </div>
          <p className="text-xs text-dark-400 leading-relaxed">
            Zbieraj karty samochodów i odkrywaj ich unikalne osiągi
          </p>
        </Card>
      </Link>

      {/* Action Grid 2x2 */}
      <div className="grid grid-cols-2 gap-3">
        <Link href="/arena">
          <Card className="relative py-4 px-4 border-turbo-500/30 bg-gradient-to-b from-turbo-500/10 to-transparent hover:border-turbo-500/50 transition-colors">
            <div className="flex items-center gap-2 mb-2">
              <div className="relative">
                <Swords className="w-6 h-6 text-turbo-500" />
                {incomingChallenges.length > 0 && (
                  <span className="absolute -top-1 -right-2 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center animate-pulse">
                    <span className="text-[9px] font-bold text-white">{incomingChallenges.length}</span>
                  </span>
                )}
              </div>
              <p className="text-sm font-semibold text-white">Arena</p>
            </div>
            <p className="text-xs text-dark-400 leading-relaxed">
              Walcz kartami z innymi graczami lub rywalizuj tunowanymi autami
            </p>
          </Card>
        </Link>

        <Link href="/mystery">
          <Card className="py-4 px-4 border-emerald-500/30 bg-gradient-to-b from-emerald-500/10 to-transparent hover:border-emerald-500/50 transition-colors">
            <div className="flex items-center gap-2 mb-2">
              <Package className="w-6 h-6 text-emerald-500" />
              <p className="text-sm font-semibold text-white">Mystery Garage</p>
            </div>
            <p className="text-xs text-dark-400 leading-relaxed">
              Otwórz pakiet losowych kart i odkryj rzadkie auta
            </p>
          </Card>
        </Link>

        <Link href="/leaderboard">
          <Card className="py-4 px-4 border-yellow-500/30 bg-gradient-to-b from-yellow-500/10 to-transparent hover:border-yellow-500/50 transition-colors">
            <div className="flex items-center gap-2 mb-2">
              <Trophy className="w-6 h-6 text-yellow-500" />
              <p className="text-sm font-semibold text-white">Ranking</p>
              <span className="text-sm font-bold text-turbo-400 ml-auto">#{userRank || '?'}</span>
            </div>
            <p className="text-xs text-dark-400 leading-relaxed">
              Twoja pozycja w rankingu najlepszych graczy
            </p>
          </Card>
        </Link>

        <Link href="/rewards">
          <Card className="py-4 px-4 border-amber-500/30 bg-gradient-to-b from-amber-500/10 to-transparent hover:border-amber-500/50 transition-colors">
            <div className="flex items-center gap-2 mb-2">
              <Gift className="w-6 h-6 text-amber-500" />
              <p className="text-sm font-semibold text-white">Nagrody</p>
            </div>
            <p className="text-xs text-dark-400 leading-relaxed">
              Sprawdź nagrody dla najlepszych w rankingu
            </p>
          </Card>
        </Link>
      </div>

      {/* Informacje o aplikacji */}
      <Card
        hover
        className="cursor-pointer"
        onClick={() => setShowAppInfo(true)}
      >
        <div className="flex items-center gap-3">
          <HelpCircle className="w-5 h-5 text-turbo-500 flex-shrink-0" />
          <div className="flex-1">
            <span className="text-sm text-dark-300">Informacje o aplikacji</span>
          </div>
          <ChevronRight className="w-4 h-4 text-dark-500" />
        </div>
      </Card>

      <AppInfoModal isOpen={showAppInfo} onClose={() => setShowAppInfo(false)} />
    </div>
  );
}
