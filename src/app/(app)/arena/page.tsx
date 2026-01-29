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
    <div className="space-y-4">
      {/* Arena Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 pt-4">
        {tabs.map(t => {
          const Icon = t.icon;
          return (
            <button
              key={t.value}
              onClick={() => setActiveTab(t.value)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-colors ${
                activeTab === t.value
                  ? 'bg-turbo-500 text-white'
                  : 'bg-dark-700 text-dark-300 hover:bg-dark-600'
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
