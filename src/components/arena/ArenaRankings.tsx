'use client';

import { useAuth } from '@/hooks/useAuth';
import { useArenaRankings } from '@/hooks/useArenaRankings';
import { Card, Avatar } from '@/components/ui';
import { Trophy, Crown, Medal, Swords, Wrench } from 'lucide-react';

export function ArenaRankings() {
  const { profile } = useAuth();
  const { rankings, loading } = useArenaRankings();

  if (!profile) return null;

  const top3 = rankings.slice(0, 3);
  const rest = rankings.slice(3);
  const myRank = rankings.find(r => r.user_id === profile.id);

  return (
    <div className="py-4 space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-yellow-500/20 mb-3">
          <Trophy className="w-8 h-8 text-yellow-500" />
        </div>
        <h1 className="text-2xl font-bold text-white">Rankingi Areny</h1>
        <p className="text-dark-400 mt-1">
          Wygrane bitwy i wyzwania tuningu
        </p>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map(i => (
            <Card key={i} className="h-16 animate-pulse bg-dark-700" />
          ))}
        </div>
      ) : rankings.length === 0 ? (
        <Card className="text-center py-12">
          <Trophy className="w-12 h-12 text-dark-600 mx-auto mb-3" />
          <p className="text-dark-400 font-medium">Brak danych rankingowych</p>
          <p className="text-sm text-dark-500 mt-1">
            Wygraj bitwy lub wyzwania tuningu, aby pojawic sie w rankingu!
          </p>
        </Card>
      ) : (
        <>
          {/* Podium TOP 3 */}
          {top3.length > 0 && (
            <div className="flex items-end justify-center gap-3 pt-4">
              {/* 2nd place */}
              {top3.length > 1 && (
                <div className="flex flex-col items-center">
                  <Avatar
                    src={top3[1].avatar_url}
                    fallback={top3[1].nick}
                    size="md"
                  />
                  <div className="mt-2 bg-slate-400/20 rounded-t-xl px-4 py-3 text-center w-24">
                    <Medal className="w-5 h-5 text-slate-300 mx-auto mb-1" />
                    <p className="text-xs font-medium text-white truncate">{top3[1].nick}</p>
                    <p className="text-xs text-slate-400">{top3[1].total_wins} W</p>
                  </div>
                </div>
              )}

              {/* 1st place */}
              <div className="flex flex-col items-center">
                <Avatar
                  src={top3[0].avatar_url}
                  fallback={top3[0].nick}
                  size="lg"
                />
                <div className="mt-2 bg-yellow-500/20 rounded-t-xl px-4 py-4 text-center w-28">
                  <Crown className="w-6 h-6 text-yellow-400 mx-auto mb-1" />
                  <p className="text-sm font-bold text-white truncate">{top3[0].nick}</p>
                  <p className="text-xs text-yellow-400">{top3[0].total_wins} W</p>
                </div>
              </div>

              {/* 3rd place */}
              {top3.length > 2 && (
                <div className="flex flex-col items-center">
                  <Avatar
                    src={top3[2].avatar_url}
                    fallback={top3[2].nick}
                    size="md"
                  />
                  <div className="mt-2 bg-orange-500/20 rounded-t-xl px-4 py-2 text-center w-24">
                    <Medal className="w-5 h-5 text-orange-400 mx-auto mb-1" />
                    <p className="text-xs font-medium text-white truncate">{top3[2].nick}</p>
                    <p className="text-xs text-orange-400">{top3[2].total_wins} W</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* My position */}
          {myRank && (
            <Card className="border-turbo-500/30 bg-turbo-500/5">
              <div className="flex items-center gap-3">
                <div className="w-8 text-center font-bold text-turbo-400">
                  #{myRank.rank}
                </div>
                <Avatar
                  src={myRank.avatar_url}
                  fallback={myRank.nick}
                  size="sm"
                />
                <div className="flex-1">
                  <p className="font-medium text-white text-sm">{myRank.nick}</p>
                  <p className="text-xs text-dark-400">Twoja pozycja</p>
                </div>
                <div className="flex items-center gap-3 text-xs">
                  <span className="flex items-center gap-1 text-orange-400">
                    <Swords className="w-3 h-3" />
                    {myRank.battle_wins}
                  </span>
                  <span className="flex items-center gap-1 text-cyan-400">
                    <Wrench className="w-3 h-3" />
                    {myRank.tuning_wins}
                  </span>
                  <span className="font-bold text-white">
                    {myRank.total_wins}
                  </span>
                </div>
              </div>
            </Card>
          )}

          {/* Column headers */}
          <div className="flex items-center gap-3 px-4 text-xs text-dark-500">
            <div className="w-8 text-center">#</div>
            <div className="flex-1">Gracz</div>
            <div className="flex items-center gap-3">
              <span className="w-10 text-center flex items-center gap-1 justify-center">
                <Swords className="w-3 h-3 text-orange-400" /> Bitwy
              </span>
              <span className="w-10 text-center flex items-center gap-1 justify-center">
                <Wrench className="w-3 h-3 text-cyan-400" /> Tuning
              </span>
              <span className="w-10 text-center font-medium">Suma</span>
            </div>
          </div>

          {/* Ranking list */}
          <div className="space-y-1">
            {rest.map(entry => {
              const isMe = entry.user_id === profile.id;
              return (
                <div
                  key={entry.user_id}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-xl transition-colors ${
                    isMe ? 'bg-turbo-500/10 border border-turbo-500/30' : 'hover:bg-dark-700/50'
                  }`}
                >
                  <div className="w-8 text-center text-sm font-medium text-dark-400">
                    {entry.rank}
                  </div>
                  <Avatar
                    src={entry.avatar_url}
                    fallback={entry.nick}
                    size="sm"
                  />
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium truncate ${isMe ? 'text-turbo-400' : 'text-white'}`}>
                      {entry.nick}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 text-xs">
                    <span className="w-10 text-center text-orange-400">{entry.battle_wins}</span>
                    <span className="w-10 text-center text-cyan-400">{entry.tuning_wins}</span>
                    <span className="w-10 text-center font-bold text-white">{entry.total_wins}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
