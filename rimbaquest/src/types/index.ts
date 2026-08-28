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
  act716_status?: string | null;
  hp?: number;
  base_attack?: number;
  ability_1?: string;
  ability_2?: string;
  ability_3?: string;
  abilities_locked?: boolean;
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
