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
export type SubmissionStatus = 'pending' | 'approved' | 'rejected' | 'revoked';

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
