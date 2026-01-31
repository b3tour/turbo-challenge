'use client';

import { useState } from 'react';
import { Swords, Wrench, Trophy } from 'lucide-react';
import { BattlesContent } from '@/components/arena/BattlesContent';
import { TuningContent } from '@/components/arena/TuningContent';
import { ArenaRankings } from '@/components/arena/ArenaRankings';

type ArenaTab = 'battles' | 'tuning' | 'rankings';

export default function ArenaPage() {
  const [activeTab, setActiveTab] = useState<ArenaTab>('battles');

  const tabs: { value: ArenaTab; label: string; icon: React.ElementType }[] = [
    { value: 'battles', label: 'Turbo Bitwy', icon: Swords },
    { value: 'tuning', label: 'Strefa Tuningu', icon: Wrench },
    { value: 'rankings', label: 'Rankingi', icon: Trophy },
  ];

  return (
    <div className="space-y-6">
      {/* Arena Tabs */}
      <div className="bg-dark-800/50 rounded-xl p-1 flex gap-1 overflow-x-auto pt-4">
        {tabs.map(t => {
          const Icon = t.icon;
          return (
            <button
              key={t.value}
              onClick={() => setActiveTab(t.value)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                activeTab === t.value
                  ? 'bg-turbo-500 text-white shadow-sm'
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
      {activeTab === 'battles' && <BattlesContent />}
      {activeTab === 'tuning' && <TuningContent />}
      {activeTab === 'rankings' && <ArenaRankings />}
    </div>
  );
}
