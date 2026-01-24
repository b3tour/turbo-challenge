// Typy dla użytkownika
export interface User {
  id: string;
  email: string;
  nick: string;
  phone?: string;
  avatar_url?: string;
  total_xp: number;
  level: number;
  class: 'solo' | 'crew';
  crew_id?: string;
  created_at: string;
  updated_at: string;
  is_admin: boolean;
  // Pola dla zmiany nicku
  nick_changes_count?: number;
  pending_nick?: string;
  pending_nick_requested_at?: string;
  // Suma datków (zakup kart samochodów)
  donation_total?: number;
}

// Typy dla poziomu
export interface Level {
  id: number;
  name: string;
  min_xp: number;
  max_xp: number;
  badge_icon: string;
  badge_color: string;
  unlocks_description?: string;
}

// Typy misji
export type MissionType = 'qr_code' | 'photo' | 'quiz' | 'gps' | 'manual';
export type MissionStatus = 'active' | 'inactive' | 'scheduled';

export interface Mission {
  id: string;
  title: string;
  description: string;
  xp_reward: number;
  type: MissionType;
  location_name?: string;
  location_lat?: number;
  location_lng?: number;
  location_radius?: number; // metry
  qr_code_value?: string;
  quiz_data?: QuizData;
  photo_requirements?: string;
  start_date?: string;
  end_date?: string;
  status: MissionStatus;
  required_level: number;
  max_completions?: number; // null = nieograniczone
  created_at: string;
  image_url?: string;
}

// Dane quizu
export type QuizMode = 'classic' | 'speedrun';

export interface QuizData {
  questions: QuizQuestion[];
  passing_score: number; // procent prawidłowych odpowiedzi
  time_limit?: number; // sekundy (dla trybu classic)
  mode?: QuizMode; // classic = z limitem czasu, speedrun = mierzy czas ukończenia
}

export interface QuizQuestion {
  id: string;
  question: string;
  answers: QuizAnswer[];
  points: number;
}

export interface QuizAnswer {
  id: string;
  text: string;
  is_correct: boolean;
}

// Zgłoszenie wykonania misji
// pending - oczekuje na weryfikację
// approved - zatwierdzone (ukończone)
// rejected - odrzucone (można spróbować ponownie)
// revoked - wycofane przez admina (można spróbować ponownie)
// failed - nieukończone (NIE można spróbować ponownie, chyba że admin zmieni status)
export type SubmissionStatus = 'pending' | 'approved' | 'rejected' | 'revoked' | 'failed';

export interface Submission {
  id: string;
  user_id: string;
  mission_id: string;
  status: SubmissionStatus;
  photo_url?: string;
  quiz_score?: number;
  quiz_time_ms?: number; // czas ukończenia quizu w milisekundach (dla trybu speedrun)
  gps_lat?: number;
  gps_lng?: number;
  admin_notes?: string;
  reviewed_by?: string;
  reviewed_at?: string;
  created_at: string;
  xp_awarded: number;
  // Relacje
  user?: User;
  mission?: Mission;
}

// Leaderboard
export interface LeaderboardEntry {
  rank: number;
  user_id: string;
  nick: string;
  avatar_url?: string;
  total_xp: number;
  level: number;
  level_name: string;
  missions_completed: number;
}

// Ranking wsparcia (datki)
export interface DonationLeaderboardEntry {
  rank: number;
  user_id: string;
  nick: string;
  avatar_url?: string;
  donation_total: number;
  cards_purchased: number;
}

// Odznaki i achievementy
export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  condition_type: 'xp_total' | 'missions_count' | 'mission_type_count' | 'level' | 'special';
  condition_value: number;
  condition_extra?: string;
  xp_bonus: number;
}

export interface UserAchievement {
  id: string;
  user_id: string;
  achievement_id: string;
  earned_at: string;
  achievement?: Achievement;
}

// Crew (drużyna)
export interface Crew {
  id: string;
  name: string;
  description?: string;
  leader_id: string;
  total_xp: number;
  created_at: string;
  member_count: number;
}

// Powiadomienia
export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'xp_gain' | 'level_up' | 'achievement' | 'mission_approved' | 'mission_rejected' | 'system';
  read: boolean;
  created_at: string;
  data?: Record<string, unknown>;
}

// Statystyki użytkownika
export interface UserStats {
  total_xp: number;
  level: number;
  rank: number;
  missions_completed: number;
  missions_pending: number;
  achievements_count: number;
  days_active: number;
  current_streak: number;
  best_streak: number;
}

// Odpowiedzi API
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

// Kontekst geolokalizacji
export interface GeoPosition {
  lat: number;
  lng: number;
  accuracy: number;
  timestamp: number;
}

// Nagrody
export type RewardType = 'xp' | 'donation';

export interface Reward {
  id: string;
  place: number; // 1, 2, 3, etc.
  title: string;
  description: string;
  image_url?: string | null;
  sponsor?: string | null;
  value?: string | null; // np. "500 zł", "Voucher"
  is_active: boolean;
  created_at: string;
  reward_type?: RewardType; // 'xp' = ranking XP, 'donation' = ranking wsparcia
}

// Karty kolekcjonerskie
export type CardRarity = 'common' | 'rare' | 'epic' | 'legendary';
export type CardType = 'achievement' | 'car';

// Karta osiągnięć (pionowa) lub samochodu (pozioma)
export interface CollectibleCard {
  id: string;
  name: string;
  description: string;
  image_url?: string | null;
  rarity: CardRarity;
  card_type: CardType;
  category: string; // np. "Eventy", "Poziomy", "Misje" lub marka samochodu
  points: number; // wartość punktowa karty
  total_supply?: number | null; // ile kart istnieje (null = nieograniczone)
  is_active: boolean;
  created_at: string;
  // Pola do zakupu karty
  price?: number | null; // cena w PLN (null = nie do kupienia)
  xp_reward?: number | null; // XP za zakup karty
  is_purchasable?: boolean; // czy karta jest dostępna do kupienia
  sold_count?: number; // ile sztuk sprzedano
  // Pola tylko dla kart samochodów (card_type = 'car')
  car_brand?: string | null; // Marka np. "Porsche"
  car_model?: string | null; // Model np. "911 Turbo S"
  car_horsepower?: number | null; // Moc w KM
  car_torque?: number | null; // Moment obrotowy w Nm
  car_max_speed?: number | null; // Prędkość max w km/h
  car_year?: number | null; // Rok produkcji
  // Pola dla Turbo Heroes
  is_hero?: boolean; // Czy to karta Hero (kierowca + auto)
  hero_name?: string | null; // Imię kierowcy np. "Jan Kowalski"
  hero_title?: string | null; // Tytuł np. "Ambasador Turbo Pomoc 2024"
}

export interface UserCard {
  id: string;
  user_id: string;
  card_id: string;
  obtained_at: string;
  obtained_from: 'mission' | 'achievement' | 'daily_spin' | 'trade' | 'admin' | 'purchase';
  card?: CollectibleCard;
}

// Zamówienia kart
export type CardOrderStatus = 'pending' | 'paid' | 'cancelled' | 'refunded';

export interface CardOrder {
  id: string;
  user_id: string;
  card_id: string;
  order_code: string; // unikalny kod zamówienia do tytułu przelewu
  amount: number; // kwota w PLN
  xp_reward: number; // XP do przyznania
  status: CardOrderStatus;
  created_at: string;
  paid_at?: string | null;
  reviewed_by?: string | null;
  admin_notes?: string | null;
  // Relacje
  user?: User;
  card?: CollectibleCard;
}

// Turbo Bitwy
export type BattleCategory = 'power' | 'torque' | 'speed' | 'total';
export type BattleRewardType = 'xp' | 'cards';
export type BattleStatus = 'pending' | 'accepted' | 'completed' | 'expired' | 'declined';

export interface CardBattle {
  id: string;
  challenger_id: string;
  opponent_id: string;
  category: BattleCategory;
  reward_type: BattleRewardType;
  status: BattleStatus;
  challenger_card_ids: string[];
  opponent_card_ids?: string[] | null;
  winner_id?: string | null;
  challenger_score?: number | null;
  opponent_score?: number | null;
  created_at: string;
  expires_at: string;
  completed_at?: string | null;
  // Relacje
  challenger?: User;
  opponent?: User;
  challenger_cards?: CollectibleCard[];
  opponent_cards?: CollectibleCard[];
}
