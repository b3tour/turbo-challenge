'use client';

import { useState } from 'react';
import { Swords, Car, History, Trophy } from 'lucide-react';
import { BattlesContent } from '@/components/arena/BattlesContent';
import { ArenaRankings } from '@/components/arena/ArenaRankings';

type ArenaTab = 'battles' | 'challenges' | 'history' | 'rankings';

export default function ArenaPage() {
  const [activeTab, setActiveTab] = useState<ArenaTab>('battles');

  const tabs: { value: ArenaTab; label: string; icon: React.ElementType }[] = [
    { value: 'battles', label: 'Bitwy', icon: Swords },
    { value: 'challenges', label: 'Wyzwania', icon: Car },
    { value: 'history', label: 'Historia', icon: History },
    { value: 'rankings', label: 'Ranking', icon: Trophy },
  ];

  return (
    <div className="py-6 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 rounded-xl bg-red-500/20 flex items-center justify-center flex-shrink-0">
          <Swords className="w-7 h-7 text-red-500" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Arena</h1>
          <p className="text-dark-400">Rywalizuj z innymi graczami</p>
        </div>
      </div>

      {/* Filter bar — missions style */}
      <div className="bg-surface-2 rounded-xl p-1 flex gap-1">
        {tabs.map(t => {
          const Icon = t.icon;
          return (
            <button
              key={t.value}
              onClick={() => setActiveTab(t.value)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === t.value
                  ? 'bg-red-500 text-white shadow-sm'
                  : 'bg-transparent text-dark-400 hover:text-dark-300'
              }`}
            >
              <Icon className="w-4 h-4" />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      {activeTab === 'rankings' ? (
        <ArenaRankings />
      ) : (
        <BattlesContent activeSubTab={activeTab} />
      )}
    </div>
  );
}
