export type Screen =
  | 'home'
  | 'photo'
  | 'photo_preview'
  | 'category'
  | 'species'
  | 'confirm'
  | 'success'
  | 'collection'
  | 'about'
  | 'battle_stats'
  | 'facts'
  | 'gallery'
  | 'quiz'
  | 'locked'
  | 'progress'
  | 'locations'
  | 'location_detail'
  | 'battle_select'
  | 'battle_arena'
  | 'account_entry'
  | 'login'
  | 'create_account'
  | 'profile_edit'
  | 'forgot_password'
  | 'reset_password';

export type Species = {
  id: string;
  common_name: string;
  scientific_name: string;
  category: string;
  habitat: string;
  diet: string;
  fun_fact: string;
  distinctive_features?: string | null;
  image_url?: string | null;
  act716_status?: string | null;
  hp?: number;
  base_attack?: number;
  ability_1?: string;
  ability_2?: string;
  ability_3?: string;
  abilities_locked?: boolean;
};

export type IdentificationFeedback = {
  correct: boolean;
  category_correct: boolean;
  species_correct: boolean;
  verified_species: Species;
  explanation?: string | null;
};

export type VerificationError = {
  kind: 'unverified' | 'failed';
  message: string;
};

export type RecentCapture = Species & {
  location_label?: string | null;
  recorded_at?: string | null;
  photo_url?: string | null;
};

export type LocationItem = {
  id: string;
  name: string;
  type: string;
  area: string;
  lat?: number;
  lng?: number;
  verified?: boolean;
  description: string;
  facilities: string[];
  best_time: string;
  distance_km: number;
  why_recommended: string;
  typical_wildlife?: string;
};

export type UserProfile = {
  id: number;
  username: string;
  email: string;
  display_name: string;
  avatar: string;
  age: number;
  age_band: string;
  xp: number;
  level: number;
};

export type GalleryItem = {
  photo_url?: string | null;
  location_label?: string | null;
  recorded_at?: string | null;
};

export type LocationMode = 'auto' | 'manual';

export type BattleAbilityItem = {
  slot: number;
  name: string;
  multiplier?: number;
  heal_amount?: number;
  description?: string;
};

export type BattleOpponent = {
  species_id: string;
  name: string;
  category: string;
  hp: number;
  max_hp: number;
  base_attack: number;
  abilities?: BattleAbilityItem[];
};

export type BattleOutcome = 'playing' | 'win' | 'lose' | null;

export type SpeciesChatMessage = {
  id: string;
  role: 'assistant' | 'user';
  content: string;
};

export type SpeciesChatResponse = {
  answer: string;
  suggested_questions?: string[];
};

export type QuizDifficulty = 'easy' | 'medium' | 'hard';

export type QuizQuestion = {
  id: string;
  question: string;
  options: string[];
};

export type QuizProgression = {
  easy_passed: boolean;
  medium_passed: boolean;
  hard_passed: boolean;
  unlocked_abilities: number[];
};

export type QuizResult = {
  score: number;
  total: number;
  passed: boolean;
  ability_unlocked?: number | null;
  message: string;
};
