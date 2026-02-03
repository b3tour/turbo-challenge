import { TuningCategory } from '@/types';

export interface ModStage {
  level: number;     // 1, 2, 3
  cost: number;      // XP
  bonus: number;     // wartosc dodana do statu
}

export interface ModDefinition {
  id: 'engine' | 'turbo' | 'weight';
  name: string;
  description: string;
  stat: 'horsepower' | 'torque' | 'speed';
  unit: string;
  stages: ModStage[];
}

// Definicje modyfikacji
export const MOD_DEFINITIONS: ModDefinition[] = [
  {
    id: 'engine',
    name: 'Silnik',
    description: 'Zwieksza moc silnika',
    stat: 'horsepower',
    unit: 'KM',
    stages: [
      { level: 1, cost: 50, bonus: 30 },
      { level: 2, cost: 120, bonus: 70 },
      { level: 3, cost: 200, bonus: 120 },
    ],
  },
  {
    id: 'turbo',
    name: 'Turbo / Wydech',
    description: 'Zwieksza moment obrotowy',
    stat: 'torque',
    unit: 'Nm',
    stages: [
      { level: 1, cost: 50, bonus: 40 },
      { level: 2, cost: 120, bonus: 90 },
      { level: 3, cost: 200, bonus: 150 },
    ],
  },
  {
    id: 'weight',
    name: 'Redukcja masy',
    description: 'Zwieksza predkosc maksymalna',
    stat: 'speed',
    unit: 'km/h',
    stages: [
      { level: 1, cost: 50, bonus: 10 },
      { level: 2, cost: 120, bonus: 25 },
      { level: 3, cost: 200, bonus: 45 },
    ],
  },
];

// Wagi kategorii wyscigow
export const CATEGORY_WEIGHTS: Record<TuningCategory, { hp: number; torque: number; speed: number }> = {
  drag:        { hp: 1.5, torque: 1.0, speed: 0.5 },
  hill_climb:  { hp: 0.5, torque: 1.5, speed: 1.0 },
  track:       { hp: 1.0, torque: 0.5, speed: 1.5 },
  time_attack: { hp: 1.0, torque: 1.0, speed: 1.0 },
};

// Etykiety kategorii
export const CATEGORY_LABELS: Record<TuningCategory, { name: string; description: string; icon: string }> = {
  drag:        { name: 'Drag Race', description: 'Moc silnika jest najwazniejsza', icon: '🏁' },
  hill_climb:  { name: 'Hill Climb', description: 'Moment obrotowy decyduje', icon: '⛰️' },
  track:       { name: 'Track Day', description: 'Predkosc max jest kluczowa', icon: '🏎️' },
  time_attack: { name: 'Time Attack', description: 'Rownowaga wszystkich statow', icon: '⏱️' },
};

// XP za wygranie bitwy tuningu
export const TUNING_WIN_XP = 30;

// Oblicz kumulatywny bonus dla danego stage'a
export function getCumulativeBonus(mod: ModDefinition, stage: number): number {
  let total = 0;
  for (let i = 0; i < stage; i++) {
    total += mod.stages[i].bonus;
  }
  return total;
}

// Oblicz kumulatywny koszt dla danego stage'a
export function getCumulativeCost(mod: ModDefinition, stage: number): number {
  let total = 0;
  for (let i = 0; i < stage; i++) {
    total += mod.stages[i].cost;
  }
  return total;
}

// Oblicz koszt nastepnego ulepszenia
export function getUpgradeCost(mod: ModDefinition, currentStage: number): number | null {
  if (currentStage >= 3) return null;
  return mod.stages[currentStage].cost;
}

// Oblicz zwrot XP za downgrade (50% kosztu, zaokraglone w dol)
export function getDowngradeRefund(mod: ModDefinition, currentStage: number): number | null {
  if (currentStage <= 0) return null;
  return Math.floor(mod.stages[currentStage - 1].cost * 0.5);
}
