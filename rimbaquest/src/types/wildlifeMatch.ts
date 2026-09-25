export type WildlifeMode = "bot" | "friend";
export type WildlifeSide = "player" | "opponent";
export type WildlifeAction = "basic" | "ability_1" | "ability_2" | "ability_3";

export interface WildlifeAbility {
  slot: number;
  kind?: "active";
  name: string;
  description?: string;
  cost: number;
  unlocked: boolean;
}

export interface WildlifeCombatant {
  species_id: string;
  name: string;
  hp: number;
  max_hp: number;
  energy: number;
  max_energy: number;
  shield?: number;
  habitat_advantage?: boolean;
  abilities: WildlifeAbility[];
}

export interface WildlifeState {
  status: "active" | "completed";
  turn: WildlifeSide | null;
  winner: WildlifeSide | null;
  player: WildlifeCombatant;
  opponent: WildlifeCombatant;
  round?: number;
  events?: WildlifeEvent[];
}

export interface WildlifeEvent {
  id?: number;
  message: string;
  type?: string;
}

export interface WildlifeMatch {
  id: string;
  mode: WildlifeMode;
  habitat: string;
  status: "setup" | "waiting" | "active" | "completed" | "expired" | "canceled";
  version: number;
  server_now: string;
  viewer_side: WildlifeSide;
  invite_code?: string | null;
  expires_at?: string | null;
  deadline_at?: string | null;
  state?: WildlifeState | null;
  events?: WildlifeEvent[];
  leaderboard_delta?: number | null;
}

export interface WildlifeInvite {
  code: string;
  match_id: string;
  habitat: string;
  status: string;
  can_join?: boolean;
}

export interface WildlifeCardOption {
  species_id: string;
  habitat_match: boolean;
  rest_remaining: number;
  selectable: boolean;
}

export interface WildlifeLeaderboardEntry {
  child_id: number;
  display_name: string;
  points: number;
  rank: number;
}

export interface WildlifeRestCard {
  species_id: string;
  remaining: number;
}
