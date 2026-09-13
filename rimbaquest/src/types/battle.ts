// RimbaQuest pixel battles - strict types aligned with battle contract

export type BattleActionType = 'basic' | 'brace' | 'active_1' | 'active_2';

export type BattleLegalAction = BattleActionType;

export type BattleRole = 'tank' | 'striker' | 'tactician' | 'support' | string;

export type BattlePhase = 'roll' | 'player_turn' | 'outcome';

export type BattleSide = 'player' | 'opponent';

export type BattleOutcomeType = 'win' | 'lose' | 'surrender' | 'draw' | null;

export type BattleDifficulty = 'standard' | 'practice';

export type BattleEffectType =
  | 'damage'
  | 'heal'
  | 'shield'
  | 'guard'
  | 'boost'
  | 'weaken'
  | 'reroll'
  | 'reduce_damage';

export type BattleEffectTarget = 'self' | 'opponent';

export interface BattleEffect {
  type: BattleEffectType;
  value: number;
  target: BattleEffectTarget;
  requires_effect?: 'shield' | 'heal' | 'guard' | 'weaken' | 'boost';
}

export type BattlePassiveTrigger =
  | 'battle_start'
  | 'low_energy'
  | 'first_active'
  | 'first_incoming_active'
  | 'first_incoming_basic'
  | 'every_third_action_damage'
  | 'every_third_action_heal'
  | 'low_roll_reroll'
  | 'first_lucky';

export interface BattleAbility {
  slot: number;
  kind?: 'active' | 'passive';
  name: string;
  description?: string;
  effects?: BattleEffect[];
  animation?: string;
  vfx?: string;
  // Legacy / UI compatibility properties
  id?: string;
  type?: 'basic' | 'brace' | 'active_1' | 'active_2' | 'passive';
  energy_cost?: number;
  multiplier?: number;
  heal_amount?: number;
  shield_amount?: number;
  status_effect?: string;
}

export interface BattlePassive {
  slot?: number;
  kind?: 'passive';
  name: string;
  description: string;
  trigger: BattlePassiveTrigger | string;
  effects?: BattleEffect[];
  threshold?: number;
  every?: number;
  max_triggers?: number;
}

export interface BattleStatusEffect {
  id: string;
  name: string;
  duration: number;
  potency: number;
  type: 'buff' | 'debuff' | 'guard' | 'shield' | string;
  description?: string;
}

export interface ActionPreviewStatus {
  id: string;
  name: string;
  potency: number;
  duration: number;
  type: string;
}

export interface ActionPreview {
  action: BattleActionType;
  name: string;
  effects: BattleEffect[];
  damage: number;
  shield_absorbed: number;
  healing: number;
  shield_gain: number;
  statuses: ActionPreviewStatus[];
  wasted_healing: number;
  wasted_shield: number;
  lucky_bonus_damage: number;
  will_end_battle: boolean;
  summary: string;
  lucky_summary: string;
}

export interface BattleCombatant {
  species_id: string;
  name: string;
  category: string;
  role: BattleRole;
  energy: number;
  max_energy: number;
  base_attack: number;
  shield: number;
  statuses: BattleStatusEffect[];
  action_count: number;
  abilities: BattleAbility[];
  passive?: BattlePassive | null;
  passive_definition?: BattlePassive | null;
  unlocked_abilities?: number[];
  passive_triggers?: number;
  reroll_ready?: boolean;
  lucky_bonus?: BattleEffect[];
}

export type BattleEventType =
  | 'encounter'
  | 'roll'
  | 'reroll'
  | 'action'
  | 'damage'
  | 'heal'
  | 'shield'
  | 'guard'
  | 'boost'
  | 'weaken'
  | 'passive'
  | 'tired'
  | 'outcome'
  | string;

export interface BattleEventSnapshot {
  player: BattleCombatant;
  opponent: BattleCombatant;
}

export interface BattleEvent {
  id: number;
  type: BattleEventType;
  message: string;
  vfx: string;
  side?: BattleSide;
  target?: BattleSide;
  action?: string;
  value?: number;
  roll?: number;
  lucky?: boolean;
  snapshot?: BattleEventSnapshot;
}

export interface BattleState {
  battle_id: string;
  version: number;
  round: number;
  phase: BattlePhase;
  active_side: BattleSide;
  player: BattleCombatant;
  opponent: BattleCombatant;
  current_roll: number | null;
  lucky: boolean;
  legal_actions: BattleLegalAction[];
  outcome: BattleOutcomeType;
  event_seq?: number;
  initiative?: BattleSide;
  difficulty?: BattleDifficulty;
  power_ratio?: number;
  action_previews?: ActionPreview[];
  rules_version?: string;
}

export interface BattleRollResponse {
  state: BattleState;
  events: BattleEvent[];
  xp_awarded?: number | null;
  total_xp?: number | null;
  first_win?: boolean;
  roll?: number;
  lucky?: boolean;
  legal_actions?: BattleLegalAction[];
  action_previews?: ActionPreview[];
}

export interface BattleActionResponse {
  state: BattleState;
  events: BattleEvent[];
  xp_awarded?: number | null;
  total_xp?: number | null;
  first_win?: boolean;
  outcome?: BattleOutcomeType;
}

export interface BattleSurrenderResponse {
  state: BattleState;
  events: BattleEvent[];
  xp_awarded?: number | null;
  total_xp?: number | null;
  first_win?: boolean;
  outcome?: BattleOutcomeType;
}

export interface BattleSessionResponse {
  state: BattleState;
  events: BattleEvent[];
  xp_awarded?: number | null;
  total_xp?: number | null;
  first_win?: boolean;
  roll?: number;
  lucky?: boolean;
  legal_actions?: BattleLegalAction[];
  action_previews?: ActionPreview[];
}
