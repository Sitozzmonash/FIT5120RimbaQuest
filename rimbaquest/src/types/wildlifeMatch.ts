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
  effects?: Array<{ type: string; value: number; target: "self" | "opponent" }>;
  vfx?: string;
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
  /** Mammal, Bird, Reptile or Butterfly. */
  category?: string;
  role?: string;
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
  side?: WildlifeSide;
  target?: WildlifeSide;
  action?: WildlifeAction;
  value?: number;
  cost?: number;
  shield_absorbed?: number;
}

export interface WildlifeMatch {
  id: string;
  mode: WildlifeMode;
  habitat: string;
  status: "setup" | "waiting" | "active" | "completed" | "expired" | "canceled";
  version: number;
  server_now: string;
  viewer_side: WildlifeSide;
  my_species_id?: string | null;
  opponent_child_id?: number | null;
  move_count?: number;
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
  host_display_name?: string;
  can_join?: boolean;
}

export interface WildlifeFriend {
  child_id: number;
  display_name: string;
  avatar?: string;
  points: number;
}

export interface AddFriendResult {
  friend: WildlifeFriend;
  alreadyFriends: boolean;
}

export interface WildlifeIncomingInvite {
  match_id: string;
  invite_code: string;
  habitat: string;
  expires_at?: string;
  friend_child_id: number;
  friend_display_name: string;
}

export interface WildlifeOutgoingInvite {
  match_id: string;
  status: "setup" | "waiting";
  expires_at?: string;
  friend_child_id: number;
  friend_display_name: string;
}

export interface WildlifeFriends {
  friend_code: string;
  friends: WildlifeFriend[];
  incoming_invites: WildlifeIncomingInvite[];
  outgoing_invites: WildlifeOutgoingInvite[];
}

export interface WildlifeCardOption {
  species_id: string;
  habitat_match: boolean;
  rest_until: string | null;
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
  rest_until: string | null;
  selectable?: boolean;
}
