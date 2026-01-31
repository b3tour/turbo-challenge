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
      {/* Welcome Card */}
      <Card variant="glass" className="relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-turbo-500/5 rounded-full blur-3xl" />

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
      <div className="animate-slide-up space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Zap className="w-5 h-5 text-red-500" />
            Dostępne misje
            {availableMissions.length > 0 && (
              <span className="inline-flex items-center justify-center w-6 h-6 bg-red-500 rounded-full text-[11px] font-bold text-white leading-none text-center">
                {availableMissions.length}
              </span>
            )}
          </h2>
          <Link
            href="/missions"
            className="flex items-center gap-1 text-sm font-medium bg-gradient-to-r from-red-400 to-orange-400 bg-clip-text text-transparent hover:from-red-300 hover:to-orange-300"
          >
            Zobacz wszystkie
            <ChevronRight className="w-4 h-4" />
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

      {/* Kolekcja kart — uproszczony box */}
      <Link href="/cards" className="block">
        <Card className="py-4 px-4 border-l-[3px] border-l-purple-500 hover:bg-white/[0.08] transition-colors">
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
          <Card className="relative py-4 px-4 border-l-[3px] border-l-turbo-500 hover:bg-white/[0.08] transition-colors">
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
          <Card className="py-4 px-4 border-l-[3px] border-l-emerald-500 hover:bg-white/[0.08] transition-colors">
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
          <Card className="py-4 px-4 border-l-[3px] border-l-yellow-500 hover:bg-white/[0.08] transition-colors">
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
          <Card className="py-4 px-4 border-l-[3px] border-l-amber-500 hover:bg-white/[0.08] transition-colors">
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
