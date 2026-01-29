import { CardRarity } from '@/types';

export interface BattleStatsForBadges {
  wins: number;
  losses: number;
  draws: number;
  totalBattles: number;
  hasPerfectWin: boolean;
}

export interface BattleBadgeDefinition {
  id: string;
  name: string;
  description: string;
  icon: 'Trophy' | 'Swords' | 'Shield' | 'Crown' | 'Star' | 'Zap' | 'Users';
  condition: (stats: BattleStatsForBadges) => boolean;
  rarity: CardRarity;
}

export const BATTLE_BADGES: BattleBadgeDefinition[] = [
  {
    id: 'first_win',
    name: 'Debiutant',
    description: 'Wygraj pierwszą bitwę',
    icon: 'Trophy',
    condition: (stats) => stats.wins >= 1,
    rarity: 'common',
  },
  {
    id: 'warrior_5',
    name: 'Wojownik',
    description: 'Wygraj 5 bitew',
    icon: 'Swords',
    condition: (stats) => stats.wins >= 5,
    rarity: 'rare',
  },
  {
    id: 'veteran_10',
    name: 'Weteran',
    description: 'Wygraj 10 bitew',
    icon: 'Shield',
    condition: (stats) => stats.wins >= 10,
    rarity: 'rare',
  },
  {
    id: 'master_25',
    name: 'Mistrz Areny',
    description: 'Wygraj 25 bitew',
    icon: 'Crown',
    condition: (stats) => stats.wins >= 25,
    rarity: 'epic',
  },
  {
    id: 'legend_50',
    name: 'Legenda Bitew',
    description: 'Wygraj 50 bitew',
    icon: 'Star',
    condition: (stats) => stats.wins >= 50,
    rarity: 'legendary',
  },
  {
    id: 'perfect_round',
    name: 'Perfekcjonista',
    description: 'Wygraj bitwę 3-0',
    icon: 'Zap',
    condition: (stats) => stats.hasPerfectWin,
    rarity: 'rare',
  },
  {
    id: 'active_10',
    name: 'Gladiator',
    description: 'Rozegraj 10 bitew',
    icon: 'Users',
    condition: (stats) => stats.totalBattles >= 10,
    rarity: 'common',
  },
];
