'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useMissions } from '@/hooks/useMissions';
import { useLeaderboard } from '@/hooks/useLeaderboard';
import { Card, ProgressBar, Avatar, AppInfoModal } from '@/components/ui';
import { SkeletonCard } from '@/components/ui/Skeleton';
import { MissionCard } from '@/components/missions';
import { formatNumber } from '@/lib/utils';
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
  Camera,
  MapPin,
  Navigation,
  TrendingUp,
  Heart,
} from 'lucide-react';

// Mapowanie typu misji na ikonę (jak v0)
const missionIconMap: Record<string, React.ElementType> = {
  qr_code: MapPin,
  quiz: HelpCircle,
  photo: Camera,
  gps: Navigation,
  manual: Target,
};

// Mapowanie typu misji na kolory (tło + tekst)
const missionColorMap: Record<string, string> = {
  qr_code: 'bg-blue-500/20 text-blue-400',
  quiz: 'bg-amber-500/20 text-amber-400',
  photo: 'bg-purple-500/20 text-purple-400',
  gps: 'bg-green-500/20 text-green-400',
  manual: 'bg-turbo-500/20 text-turbo-400',
};
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

  // Misje posortowane po XP
  const sortedMissions = [...availableMissions]
    .sort((a, b) => (b.xp_reward || 0) - (a.xp_reward || 0));

  // Kolekcja stats
  const collectionStats = getCollectionStats();

  return (
    <div className="space-y-8 py-6">
      {/* Profile Card */}
      <Card variant="glass" className="relative overflow-hidden p-5 animate-slide-up">
        {/* Background Effects */}
        <div className="absolute -right-12 -top-12 h-32 w-32 rounded-full bg-turbo-500/10 blur-3xl" />
        <div className="absolute -bottom-8 -left-8 h-24 w-24 rounded-full bg-accent-400/10 blur-3xl" />

        <div className="relative">
          {/* User Info */}
          <div className="flex items-start gap-5">
            {/* Avatar */}
            <Avatar
              src={profile.avatar_url}
              fallback={profile.nick}
              size="xl"
              className="rounded-2xl ring-2 ring-turbo-500/30"
            />

            {/* Info */}
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h2 className="text-xl font-bold text-white">{profile.nick}</h2>
                  <div className="mt-0.5 flex items-center gap-1.5">
                    <span className="text-sm">{level.badge_icon}</span>
                    <span className="text-sm text-dark-400">{level.name}</span>
                  </div>
                </div>

                {/* Rank Display */}
                {userRank && (
                  <div className="text-right">
                    <div className="flex items-center gap-1 text-xs text-dark-400">
                      <Trophy className="h-3 w-3" />
                      <span>Ranking</span>
                    </div>
                    <div className="mt-0.5 text-2xl font-bold text-gradient-gold">
                      #{userRank}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* XP Section */}
          <div className="mt-5">
            <div className="mb-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-turbo-500" />
                <span className="text-sm font-medium text-white">Poziom {level.id}</span>
              </div>
              <span className="rounded-lg bg-turbo-500/10 px-2 py-1 text-xs font-bold text-turbo-400">
                {formatNumber(profile.total_xp)} XP
              </span>
            </div>

            <ProgressBar value={progress} animated />

            <div className="mt-2 flex items-center justify-between text-xs text-dark-500">
              <span>
                {nextLevel ? `${formatNumber(xpNeeded)} XP do poziomu ${nextLevel.id}` : 'Maksymalny poziom!'}
              </span>
              <span>{progress}%</span>
            </div>
          </div>

          {/* Donation Card */}
          <div className="mt-5 rounded-xl bg-[#131316] p-4">
            <div className="flex items-center gap-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/[0.06] flex-shrink-0">
                <Heart className="h-5 w-5 text-red-500 fill-red-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white">Wsparcie Turbo Pomoc</p>
                <p className="text-xs text-dark-500">
                  {(profile.donation_total || 0) > 0
                    ? 'Dziękujemy za Twój wkład!'
                    : 'Kup kartę i wesprzyj fundację!'}
                </p>
              </div>
              <p className="text-lg font-bold text-green-400 flex-shrink-0">
                {(profile.donation_total || 0).toFixed(2)} zł
              </p>
              <ChevronRight className="h-5 w-5 text-dark-500 flex-shrink-0" />
            </div>
          </div>
        </div>
      </Card>

      {/* Available Missions */}
      <div className="animate-slide-up space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-pink-500/20">
              <Zap className="h-4 w-4 text-pink-500" />
            </div>
            <h2 className="text-lg font-semibold text-white">Dostępne misje</h2>
            {availableMissions.length > 0 && (
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-pink-500/20 text-xs font-bold text-pink-400">
                {availableMissions.length}
              </span>
            )}
          </div>
          <Link
            href="/missions"
            className="flex items-center gap-1 text-sm font-medium group"
          >
            <span className="bg-gradient-to-r from-red-400 to-pink-400 bg-clip-text text-transparent group-hover:from-red-300 group-hover:to-pink-300">
              Zobacz wszystkie
            </span>
            <ChevronRight className="w-4 h-4 text-pink-400 group-hover:text-pink-300" />
          </Link>
        </div>

        {/* Cards */}
        {missionsLoading ? (
          <SkeletonCard />
        ) : availableMissions.length === 0 ? (
          <Card className="text-center py-6">
            <Target className="w-10 h-10 text-dark-600 mx-auto mb-2" />
            <p className="text-dark-400 text-sm">Gratulacje! Wszystkie misje ukończone.</p>
            <p className="text-dark-500 text-xs mt-1">Oczekuj na kolejne wyzwania!</p>
          </Card>
        ) : (
          <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-2 scrollbar-hide">
            {sortedMissions.map((mission, index) => {
              const Icon = missionIconMap[mission.type] || Target;
              const colorClass = missionColorMap[mission.type] || missionColorMap.manual;
              return (
                <Link
                  key={mission.id}
                  href="/missions"
                  className="animate-slide-up group flex w-32 flex-shrink-0 flex-col items-center gap-3 rounded-xl border border-white/[0.07] bg-white/[0.05] p-4 text-center transition-all hover:border-turbo-500/50 hover:bg-white/[0.08]"
                  style={{ animationDelay: `${index * 0.1}s`, animationFillMode: 'backwards' }}
                >
                  {/* Ikona z badge XP */}
                  <div className="relative">
                    <div className={`flex h-14 w-14 items-center justify-center rounded-xl transition-transform group-hover:scale-110 ${colorClass}`}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <span className="absolute -right-2 -top-2 inline-flex items-center rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-bold leading-none text-white">
                      +{mission.xp_reward} XP
                    </span>
                  </div>

                  {/* Tytuł misji */}
                  <span className="line-clamp-2 text-xs font-medium leading-tight text-white">
                    {mission.title}
                  </span>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* Kolekcja kart — Minimal Clean */}
      <Link
        href="/cards"
        className="group flex animate-slide-up items-center gap-4 rounded-2xl border border-white/[0.07] bg-white/[0.05] p-4 transition-all hover:border-turbo-500/50 hover:bg-white/[0.08]"
      >
        {/* Icon */}
        <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-turbo-500/20 to-accent-400/20">
          <Layers className="h-7 w-7 text-turbo-500" />
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-white">Kolekcja kart</h3>
            <span className="text-sm font-bold text-turbo-400">
              {collectionStats.collected}
              <span className="text-dark-400">/{collectionStats.total}</span>
            </span>
          </div>

          {/* Progress Bar */}
          <div className="mt-3 h-3 overflow-hidden rounded-full bg-white/[0.06]">
            <div
              className="h-full rounded-full bg-gradient-to-r from-turbo-500 via-turbo-500 to-accent-400 transition-all duration-700 group-hover:shadow-[0_0_10px_rgba(217,70,239,0.5)]"
              style={{ width: `${collectionStats.total > 0 ? Math.round((collectionStats.collected / collectionStats.total) * 100) : 0}%` }}
            />
          </div>

          <p className="mt-2 text-xs text-dark-400">
            Zbieraj karty i wspieraj Turbo Pomoc!
          </p>
        </div>

        <ChevronRight className="h-5 w-5 flex-shrink-0 text-dark-500 transition-all group-hover:translate-x-1 group-hover:text-turbo-500" />
      </Link>

      {/* Action Grid 2x2 — Glow Cards */}
      <div className="grid grid-cols-2 gap-3">
        {/* Arena */}
        <Link
          href="/arena"
          className="group relative animate-slide-up overflow-hidden rounded-2xl border border-red-500/30 bg-white/[0.05] p-4 transition-all duration-300 hover:border-red-500/60 hover:shadow-[0_0_30px_rgba(239,68,68,0.15)]"
          style={{ animationDelay: '0.3s', animationFillMode: 'backwards' }}
        >
          <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-red-500/10 opacity-30 blur-2xl transition-opacity group-hover:opacity-50" />
          <div className="relative space-y-3">
            <div className="flex items-start justify-between">
              <div className="rounded-xl bg-red-500/10 p-2.5">
                <Swords className="h-6 w-6 text-red-500" />
              </div>
              {incomingChallenges.length > 0 && (
                <span className="rounded-lg bg-red-500/10 px-2 py-1 text-xs font-bold text-red-400 animate-pulse">
                  {incomingChallenges.length} nowe
                </span>
              )}
            </div>
            <div>
              <h4 className="font-semibold text-white">Arena</h4>
              <p className="mt-1 text-xs leading-relaxed text-dark-400 line-clamp-2">
                Walcz kartami z innymi graczami lub rywalizuj tunowanymi autami
              </p>
            </div>
          </div>
          <ChevronRight className="absolute bottom-4 right-3 h-5 w-5 text-dark-500 opacity-0 transition-all group-hover:translate-x-1 group-hover:opacity-100" />
        </Link>

        {/* Mystery Garage */}
        <Link
          href="/mystery"
          className="group relative animate-slide-up overflow-hidden rounded-2xl border border-green-500/30 bg-white/[0.05] p-4 transition-all duration-300 hover:border-green-500/60 hover:shadow-[0_0_30px_rgba(34,197,94,0.15)]"
          style={{ animationDelay: '0.35s', animationFillMode: 'backwards' }}
        >
          <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-green-500/10 opacity-30 blur-2xl transition-opacity group-hover:opacity-50" />
          <div className="relative space-y-3">
            <div className="flex items-start justify-between">
              <div className="rounded-xl bg-green-500/10 p-2.5">
                <Package className="h-6 w-6 text-green-400" />
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-white">Mystery Garage</h4>
              <p className="mt-1 text-xs leading-relaxed text-dark-400 line-clamp-2">
                Otwórz pakiet losowych kart i odkryj rzadkie auta
              </p>
            </div>
          </div>
          <ChevronRight className="absolute bottom-4 right-3 h-5 w-5 text-dark-500 opacity-0 transition-all group-hover:translate-x-1 group-hover:opacity-100" />
        </Link>

        {/* Ranking */}
        <Link
          href="/leaderboard"
          className="group relative animate-slide-up overflow-hidden rounded-2xl border border-amber-500/30 bg-white/[0.05] p-4 transition-all duration-300 hover:border-amber-500/60 hover:shadow-[0_0_30px_rgba(245,158,11,0.15)]"
          style={{ animationDelay: '0.4s', animationFillMode: 'backwards' }}
        >
          <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-amber-500/10 opacity-30 blur-2xl transition-opacity group-hover:opacity-50" />
          <div className="relative space-y-3">
            <div className="flex items-start justify-between">
              <div className="rounded-xl bg-amber-500/10 p-2.5">
                <Trophy className="h-6 w-6 text-amber-400" />
              </div>
              <span className="rounded-lg bg-amber-500/10 px-2 py-1 text-xs font-bold text-amber-400">
                #{userRank || '?'}
              </span>
            </div>
            <div>
              <h4 className="font-semibold text-white">Ranking</h4>
              <p className="mt-1 text-xs leading-relaxed text-dark-400 line-clamp-2">
                Twoja pozycja w rankingu najlepszych graczy
              </p>
            </div>
          </div>
          <ChevronRight className="absolute bottom-4 right-3 h-5 w-5 text-dark-500 opacity-0 transition-all group-hover:translate-x-1 group-hover:opacity-100" />
        </Link>

        {/* Nagrody */}
        <Link
          href="/rewards"
          className="group relative animate-slide-up overflow-hidden rounded-2xl border border-cyan-500/30 bg-white/[0.05] p-4 transition-all duration-300 hover:border-cyan-500/60 hover:shadow-[0_0_30px_rgba(6,182,212,0.15)]"
          style={{ animationDelay: '0.45s', animationFillMode: 'backwards' }}
        >
          <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-cyan-500/10 opacity-30 blur-2xl transition-opacity group-hover:opacity-50" />
          <div className="relative space-y-3">
            <div className="flex items-start justify-between">
              <div className="rounded-xl bg-cyan-500/10 p-2.5">
                <Gift className="h-6 w-6 text-cyan-400" />
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-white">Nagrody</h4>
              <p className="mt-1 text-xs leading-relaxed text-dark-400 line-clamp-2">
                Sprawdź nagrody dla najlepszych w rankingu
              </p>
            </div>
          </div>
          <ChevronRight className="absolute bottom-4 right-3 h-5 w-5 text-dark-500 opacity-0 transition-all group-hover:translate-x-1 group-hover:opacity-100" />
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
