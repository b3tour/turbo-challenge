'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useMissions } from '@/hooks/useMissions';
import { useLeaderboard } from '@/hooks/useLeaderboard';
import { Card, Badge, Button, ProgressBar, Avatar } from '@/components/ui';
import { MissionCard } from '@/components/missions';
import {
  calculateLevel,
  calculateLevelProgress,
  xpToNextLevel,
  formatNumber,
  LEVELS,
} from '@/lib/utils';
import {
  Target,
  Trophy,
  Heart,
  TrendingUp,
  ChevronRight,
  Zap,
  Medal,
  Gift,
  Crown,
  Award,
  Layers,
} from 'lucide-react';
import { useCards, RARITY_CONFIG } from '@/hooks/useCards';

export default function DashboardPage() {
  const router = useRouter();
  const { profile } = useAuth();
  const { missions, userSubmissions, loading: missionsLoading } = useMissions({
    userId: profile?.id,
    activeOnly: true,
  });
  const { leaderboard, getUserRank, loading: leaderboardLoading } = useLeaderboard({
    limit: 5,
  });
  const { getCollectionStats, userCards } = useCards({ userId: profile?.id });

  if (!profile) return null;

  // Synchronicznie pobierz ranking użytkownika z cache
  const userRank = getUserRank(profile.id);

  const level = calculateLevel(profile.total_xp);
  const progress = calculateLevelProgress(profile.total_xp);
  const xpNeeded = xpToNextLevel(profile.total_xp);
  const nextLevel = LEVELS.find(l => l.id === level.id + 1);

  // Misje które są już ukończone, oczekują na weryfikację lub nieukończone (nie pokazujemy ich jako dostępne)
  const busyMissionIds = userSubmissions
    .filter(s => s.status === 'approved' || s.status === 'pending' || s.status === 'failed')
    .map(s => s.mission_id);

  // Dostępne misje - tylko te bez zgłoszenia lub odrzucone/wycofane, posortowane od najnowszych
  const availableMissions = missions
    .filter(m => !busyMissionIds.includes(m.id))
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  // Liczba ukończonych misji
  const completedMissionIds = userSubmissions
    .filter(s => s.status === 'approved')
    .map(s => s.mission_id);

  const completedCount = completedMissionIds.length;
  const totalXpEarned = userSubmissions
    .filter(s => s.status === 'approved')
    .reduce((sum, s) => sum + (s.xp_awarded || 0), 0);

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
              <Heart className="w-4 h-4 text-red-500" />
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

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card padding="sm" className="text-center">
          <Target className="w-6 h-6 text-turbo-500 mx-auto mb-1" />
          <div className="text-xl font-bold text-white">{completedCount}</div>
          <div className="text-xs text-dark-400">Misji</div>
        </Card>

        <Card padding="sm" className="text-center">
          <Heart className="w-6 h-6 text-red-500 mx-auto mb-1" />
          <div className="text-xl font-bold text-white">{formatNumber(totalXpEarned)}</div>
          <div className="text-xs text-dark-400">XP zdobyte</div>
        </Card>

        <Card padding="sm" className="text-center">
          <Medal className="w-6 h-6 text-blue-500 mx-auto mb-1" />
          <div className="text-xl font-bold text-white">{level.id}</div>
          <div className="text-xs text-dark-400">Poziom</div>
        </Card>
      </div>

      {/* Available Missions */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Zap className="w-5 h-5 text-turbo-500" />
            Dostępne misje
          </h2>
          <Link
            href="/missions"
            className="text-sm text-accent-400 flex items-center"
          >
            Zobacz wszystkie
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {missionsLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <Card key={i} className="h-24 animate-pulse bg-dark-700" />
            ))}
          </div>
        ) : availableMissions.length > 0 ? (
          <div className="space-y-3">
            {availableMissions.slice(0, 3).map(mission => (
              <MissionCard
                key={mission.id}
                mission={mission}
                compact
                onClick={() => router.push('/missions')}
              />
            ))}
          </div>
        ) : (
          <Card className="text-center py-8">
            <Target className="w-12 h-12 text-dark-600 mx-auto mb-3" />
            <p className="text-dark-400">Wszystkie misje ukończone!</p>
            <p className="text-sm text-dark-500 mt-1">
              Sprawdź później - nowe misje wkrótce!
            </p>
          </Card>
        )}
      </div>

      {/* Cards Collection Preview */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Layers className="w-5 h-5 text-purple-500" />
            Kolekcja kart
          </h2>
          <Link
            href="/cards"
            className="text-sm text-accent-400 flex items-center"
          >
            Zobacz wszystkie
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        <Card className="relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl" />
          <div className="relative">
            {(() => {
              const stats = getCollectionStats();
              const progress = stats.total > 0 ? Math.round((stats.collected / stats.total) * 100) : 0;

              return (
                <>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-dark-400">Postęp kolekcji</span>
                    <span className="text-purple-400 font-bold">{stats.collected}/{stats.total}</span>
                  </div>

                  <div className="h-2 bg-dark-700 rounded-full overflow-hidden mb-4">
                    <div
                      className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all"
                      style={{ width: `${progress}%` }}
                    />
                  </div>

                  <div className="grid grid-cols-4 gap-2">
                    {(['common', 'rare', 'epic', 'legendary'] as const).map(rarity => {
                      const config = RARITY_CONFIG[rarity];
                      const rarityStats = stats.byRarity[rarity];
                      return (
                        <div key={rarity} className={`text-center p-2 rounded-lg ${config.bgColor}`}>
                          <div className="text-xl">{config.icon}</div>
                          <div className={`text-xs font-medium ${config.color}`}>
                            {rarityStats.collected}/{rarityStats.total}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              );
            })()}
          </div>
        </Card>
      </div>

      {/* Leaderboard Preview */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-500" />
            Top gracze
          </h2>
          <Link
            href="/leaderboard"
            className="text-sm text-accent-400 flex items-center"
          >
            Pełny ranking
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {leaderboardLoading ? (
          <Card className="animate-pulse h-48 bg-dark-700" />
        ) : (
          <Card padding="sm">
            <div className="divide-y divide-dark-700">
              {leaderboard.slice(0, 5).map((entry, index) => (
                <div
                  key={entry.user_id}
                  className={`flex items-center gap-3 py-2.5 ${
                    entry.user_id === profile.id ? 'bg-turbo-500/10 -mx-3 px-3 rounded-lg' : ''
                  }`}
                >
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold ${
                      index === 0
                        ? 'bg-yellow-500 text-black'
                        : index === 1
                        ? 'bg-gray-400 text-black'
                        : index === 2
                        ? 'bg-amber-700 text-white'
                        : 'bg-dark-700 text-dark-300'
                    }`}
                  >
                    {entry.rank}
                  </div>
                  <Avatar
                    src={entry.avatar_url}
                    fallback={entry.nick}
                    size="sm"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-white truncate">{entry.nick}</p>
                    <p className="text-xs text-dark-400">{entry.level_name}</p>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-turbo-400">
                      {formatNumber(entry.total_xp)}
                    </div>
                    <div className="text-xs text-dark-500">XP</div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>

      {/* Rewards Preview */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Gift className="w-5 h-5 text-yellow-500" />
            Nagrody do zdobycia
          </h2>
          <Link
            href="/rewards"
            className="text-sm text-accent-400 flex items-center"
          >
            Zobacz wszystkie
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        <Card className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/5 via-transparent to-amber-500/5" />
          <div className="relative">
            {/* Podium preview */}
            <div className="flex items-end justify-center gap-2 py-4">
              {/* 2. miejsce */}
              <div className="flex flex-col items-center">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-300 to-gray-500 flex items-center justify-center mb-1 shadow-lg">
                  <Medal className="w-5 h-5 text-white" />
                </div>
                <div className="w-16 h-12 bg-gradient-to-t from-gray-500 to-gray-400 rounded-t-lg flex items-center justify-center">
                  <span className="text-white font-bold text-lg">2</span>
                </div>
              </div>

              {/* 1. miejsce */}
              <div className="flex flex-col items-center -mt-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-yellow-400 to-amber-600 flex items-center justify-center mb-1 shadow-lg shadow-yellow-500/30">
                  <Crown className="w-6 h-6 text-white" />
                </div>
                <div className="w-20 h-16 bg-gradient-to-t from-yellow-600 to-yellow-400 rounded-t-lg flex items-center justify-center">
                  <span className="text-white font-bold text-xl">1</span>
                </div>
              </div>

              {/* 3. miejsce */}
              <div className="flex flex-col items-center">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-600 to-orange-800 flex items-center justify-center mb-1 shadow-lg">
                  <Award className="w-5 h-5 text-white" />
                </div>
                <div className="w-16 h-10 bg-gradient-to-t from-amber-800 to-amber-600 rounded-t-lg flex items-center justify-center">
                  <span className="text-white font-bold text-lg">3</span>
                </div>
              </div>
            </div>

            <p className="text-center text-dark-300 text-sm pb-2">
              Zdobądź TOP 3 i wygraj nagrody!
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
