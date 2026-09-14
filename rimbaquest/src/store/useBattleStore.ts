import { create } from "zustand";
import { API_BASE } from "../constants/config";
import { BattleAbilityItem, BattleOpponent, BattleOutcome, Species } from "../types";
import { useNavigationStore } from "./useNavigationStore";
import { useUserStore } from "./useUserStore";

const DEFAULT_OPPONENT: BattleOpponent = {
  species_id: "sp_wild_boar",
  name: "Wild Boar",
  category: "Mammal",
  hp: 110,
  max_hp: 110,
  base_attack: 20,
};

function moveDescription(move: BattleAbilityItem): string {
  const hit = (move.multiplier ?? 1) >= 2 ? "A very strong hit." : "A strong hit.";
  return (move.heal_amount ?? 0) > 0
    ? `${hit} Brings back ${move.heal_amount} health.`
    : hit;
}

function botMoveLog(
  name: string,
  action: { action_name: string; damage: number; healing: number },
): string {
  if (action.damage <= 0) return `${name} tried ${action.action_name}, but missed!`;
  const healing =
    action.healing > 0 ? ` It got back ${action.healing} health.` : "";
  return `${name} used ${action.action_name}. It took ${action.damage} health.${healing}`;
}

const FALLBACK_ABILITIES: Record<string, BattleAbilityItem[]> = {
  Mammal: [
    { slot: 1, name: "Swift Pounce", multiplier: 1.5, heal_amount: 0, description: "A fast jumping attack." },
    { slot: 2, name: "Wild Roar", multiplier: 0.8, heal_amount: 25, description: "A loud roar that brings back health." },
    { slot: 3, name: "Guardian Guard", multiplier: 2.2, heal_amount: 10, description: "A strong attack that also brings back health." },
  ],
  Reptile: [
    { slot: 1, name: "Iron Scales", multiplier: 1.4, heal_amount: 0, description: "A charge protected by hard scales." },
    { slot: 2, name: "Venom Strike", multiplier: 1.3, heal_amount: 20, description: "A bite that also brings back health." },
    { slot: 3, name: "Ambush Snap", multiplier: 2.1, heal_amount: 0, description: "A very strong surprise attack." },
  ],
  Bird: [
    { slot: 1, name: "Aerial Dive", multiplier: 1.5, heal_amount: 0, description: "A fast dive from the sky." },
    { slot: 2, name: "Sonic Cry", multiplier: 1.3, heal_amount: 15, description: "A loud cry that also brings back health." },
    { slot: 3, name: "Sharp Talon", multiplier: 2.2, heal_amount: 0, description: "A very strong claw attack." },
  ],
  Butterfly: [
    { slot: 1, name: "Toxic Powder", multiplier: 1.5, heal_amount: 0, description: "A cloud of stinging dust." },
    { slot: 2, name: "Nectar Heal", multiplier: 0.5, heal_amount: 35, description: "A sip of nectar that brings back health." },
    { slot: 3, name: "Dazzle Flutter", multiplier: 2.0, heal_amount: 15, description: "A bright wing attack that also brings back health." },
  ],
};

function getFallbackAbilities(category?: string): BattleAbilityItem[] {
  const cat = (category || "").charAt(0).toUpperCase() + (category || "").slice(1).toLowerCase();
  return FALLBACK_ABILITIES[cat] || [
    { slot: 1, name: "Basic Tackle", multiplier: 1.4, heal_amount: 0, description: "A strong body bump." },
    { slot: 2, name: "Defend", multiplier: 0.6, heal_amount: 20, description: "Blocks an attack and brings back health." },
    { slot: 3, name: "Focus Strike", multiplier: 2.0, heal_amount: 0, description: "A very strong attack." },
  ];
}

async function executeBotTurn(
  currentOpponent: BattleOpponent,
  botHp: number,
  playerHp: number,
  round: number,
): Promise<{ action_name: string; damage: number; healing: number; log: string }> {
  try {
    const res = await fetch(`${API_BASE}/api/v1/battle/bot-turn`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        bot_data: currentOpponent,
        bot_current_hp: botHp,
        player_current_hp: playerHp,
        round_num: round,
      }),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.action) {
        return {
          ...data.action,
          log: botMoveLog(currentOpponent.name, data.action),
        };
      }
    }
  } catch {
    // offline fallback
  }

  const baseAtk = currentOpponent.base_attack || 20;
  const hit = Math.random() < 0.85;
  const dmg = hit ? baseAtk : 0;
  const log = hit
    ? `${currentOpponent.name} used Quick Attack. It took ${dmg} health.`
    : `${currentOpponent.name}'s Quick Attack missed!`;
  return {
    action_name: "Quick Attack",
    damage: dmg,
    healing: 0,
    log,
  };
}

// Guards recordBattleResult against double-submission (e.g. a stray extra
// call racing the outcome already being recorded). Reset at the start of
// every new battle.
let resultRecorded = false;

async function recordBattleResult(won: boolean, rounds: number) {
  const { currentUser: user, authHeaders } = useUserStore.getState();
  const { opponent } = useBattleStore.getState();
  if (resultRecorded || !user.id) return;
  resultRecorded = true;
  try {
    const res = await fetch(`${API_BASE}/api/v1/children/${user.id}/battle/record`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify({
        won,
        opponent_name: opponent.name,
        rounds,
      }),
    });
    if (!res.ok) {
      resultRecorded = false;
      return;
    }
    const data = (await res.json()) as { xp_awarded?: number; total_xp?: number };
    if (typeof data.xp_awarded === "number") useBattleStore.setState({ xpAwarded: data.xp_awarded });
    if (typeof data.total_xp === "number") {
      useUserStore.getState().updateCurrentUser({ xp: data.total_xp });
    }
  } catch {
    resultRecorded = false;
  }
}

type BattleState = {
  playerCard: Species | null;
  playerHp: number;
  playerMaxHp: number;
  opponent: BattleOpponent;
  opponentHp: number;
  opponentMaxHp: number;
  unlockedAbilities: number[];
  abilities: BattleAbilityItem[];
  log: string[];
  round: number;
  outcome: BattleOutcome;
  xpAwarded: number | null;
  isAttacking: boolean;
  giveUpConfirmVisible: boolean;
  preparingBattle: boolean;
};

type BattleActions = {
  selectCard: (card: Species | null) => void;
  resetCardSelection: () => void;
  startBattle: (card: Species) => Promise<void>;
  attack: () => void;
  useAbility: (slot: number) => void;
  giveUp: () => void;
  battleAgain: () => void;
  selectAnotherCard: () => void;
  openGiveUpConfirm: () => void;
  closeGiveUpConfirm: () => void;
};

export type BattleStore = BattleState & BattleActions;

export const useBattleStore = create<BattleStore>((set, get) => ({
  playerCard: null,
  playerHp: 120,
  playerMaxHp: 120,
  opponent: DEFAULT_OPPONENT,
  opponentHp: DEFAULT_OPPONENT.hp,
  opponentMaxHp: DEFAULT_OPPONENT.hp,
  unlockedAbilities: [],
  abilities: [],
  log: [],
  round: 1,
  outcome: null,
  xpAwarded: null,
  isAttacking: false,
  giveUpConfirmVisible: false,
  preparingBattle: false,

  selectCard: (card) => set({ playerCard: card }),
  resetCardSelection: () => set({ playerCard: null }),

  startBattle: async (card) => {
    if (get().preparingBattle) return;
    resultRecorded = false;
    set({
      playerCard: card,
      xpAwarded: null,
      giveUpConfirmVisible: false,
      preparingBattle: true,
    });

    const { currentUser: user, authHeaders } = useUserStore.getState();

    let opponent: BattleOpponent = DEFAULT_OPPONENT;
    let unlocked: number[] = [];
    let abilities: BattleAbilityItem[] = getFallbackAbilities(card.category);
    let playerMaxHp = card.hp || 120;

    if (user.id) {
      try {
        const [oppRes, cardRes] = await Promise.all([
          fetch(`${API_BASE}/api/v1/children/${user.id}/battle/opponent?player_species_id=${encodeURIComponent(card.id)}`, {
            headers: authHeaders(),
          }),
          fetch(`${API_BASE}/api/v1/children/${user.id}/species/${encodeURIComponent(card.id)}/battle-card`, {
            headers: authHeaders(),
          }),
        ]);

        if (oppRes.ok) {
          const oppData = await oppRes.json();
          if (oppData.opponent) {
            opponent = {
              species_id: oppData.opponent.species_id || "sp_wild_boar",
              name: oppData.opponent.name || "Wild Boar",
              category: oppData.opponent.category || "Mammal",
              hp: oppData.opponent.hp || 110,
              max_hp: oppData.opponent.max_hp || oppData.opponent.hp || 110,
              base_attack: oppData.opponent.base_attack || 20,
              abilities: oppData.opponent.abilities,
            };
          }
        }

        if (cardRes.ok) {
          const cardData = await cardRes.json();
          if (cardData.card) {
            if (cardData.card.hp) playerMaxHp = cardData.card.hp;
            if (Array.isArray(cardData.card.unlocked_abilities)) {
              unlocked = cardData.card.unlocked_abilities;
            }
            if (Array.isArray(cardData.card.abilities_details)) {
              abilities = cardData.card.abilities_details.map(
                (move: BattleAbilityItem) => ({
                  ...move,
                  description: moveDescription(move),
                }),
              );
            }
          }
        }
      } catch {
        // Fallback to defaults
      }
    }

    set({
      opponent,
      unlockedAbilities: unlocked,
      abilities,
      playerHp: playerMaxHp,
      playerMaxHp,
      opponentHp: opponent.hp,
      opponentMaxHp: opponent.max_hp,
      log: [
        `A wild ${opponent.name} appeared!`,
        `You sent out ${card.common_name}.`,
      ],
      round: 1,
      outcome: "playing",
      preparingBattle: false,
    });
    useNavigationStore.getState().open("battle_arena");
  },

  attack: () => {
    const { playerCard, isAttacking, outcome, opponent, opponentHp, opponentMaxHp, playerHp, round, log } = get();
    if (!playerCard || isAttacking || outcome !== "playing") return;
    set({ isAttacking: true });

    const missed = Math.random() < 0.15;
    const playerDmg = missed ? 0 : playerCard.base_attack || 25;
    const nextOpponentHp = Math.max(0, opponentHp - playerDmg);
    const newLogs = [
      ...log,
      missed
        ? `${playerCard.common_name}'s Basic Attack missed!`
        : `${playerCard.common_name} used Basic Attack for ${playerDmg} damage.`,
    ];

    if (nextOpponentHp <= 0) {
      newLogs.push(`${opponent.name} is out of health. You won!`);
      set({ opponentHp: 0, log: newLogs, outcome: "win", isAttacking: false });
      void recordBattleResult(true, round);
      return;
    }

    set({ opponentHp: nextOpponentHp, log: newLogs });

    setTimeout(async () => {
      const botAction = await executeBotTurn(opponent, nextOpponentHp, playerHp, round);
      if (botAction.healing > 0) {
        set((state) => ({
          opponentHp: Math.min(opponentMaxHp, state.opponentHp + botAction.healing),
        }));
      }
      const nextPlayerHp = Math.max(0, playerHp - botAction.damage);
      newLogs.push(botAction.log);
      if (nextPlayerHp <= 0) {
        newLogs.push(`${playerCard.common_name} is too tired to continue.`);
        set({ playerHp: 0, log: [...newLogs], outcome: "lose", isAttacking: false });
        void recordBattleResult(false, round);
      } else {
        set({ playerHp: nextPlayerHp, log: [...newLogs], round: round + 1, isAttacking: false });
      }
    }, 500);
  },

  useAbility: (slot) => {
    const {
      playerCard, isAttacking, outcome, opponent, opponentHp, opponentMaxHp,
      playerHp, playerMaxHp, round, log, abilities,
    } = get();
    if (!playerCard || isAttacking || outcome !== "playing") return;
    set({ isAttacking: true });

    const ability = abilities.find((a) => a.slot === slot) || {
      slot,
      name: `Ability ${slot}`,
      multiplier: slot === 3 ? 2.0 : slot === 2 ? 0.8 : 1.5,
      heal_amount: slot === 2 ? 25 : 0,
    };

    const baseAtk = playerCard.base_attack || 25;
    const mult = typeof ability.multiplier === "number" ? ability.multiplier : 1.0;
    const dmg = Math.round(baseAtk * mult);
    const heal = ability.heal_amount || 0;

    let nextPlayerHp = playerHp;
    if (heal > 0) {
      nextPlayerHp = Math.min(playerMaxHp, playerHp + heal);
      set({ playerHp: nextPlayerHp });
    }

    const nextOpponentHp = Math.max(0, opponentHp - dmg);
    set({ opponentHp: nextOpponentHp });

    let abilityLog = `${playerCard.common_name} used ${ability.name}! Opponent lost ${dmg} HP.`;
    if (heal > 0) {
      abilityLog += ` Recovered ${heal} HP.`;
    }
    const newLogs = [...log, abilityLog];

    if (nextOpponentHp <= 0) {
      newLogs.push(`${opponent.name} is out of health. You won!`);
      set({ opponentHp: 0, log: newLogs, outcome: "win", isAttacking: false });
      void recordBattleResult(true, round);
      return;
    }

    set({ log: newLogs });

    setTimeout(async () => {
      const botAction = await executeBotTurn(opponent, nextOpponentHp, nextPlayerHp, round);
      if (botAction.healing > 0) {
        set((state) => ({
          opponentHp: Math.min(opponentMaxHp, state.opponentHp + botAction.healing),
        }));
      }
      const afterBotPlayerHp = Math.max(0, nextPlayerHp - botAction.damage);
      newLogs.push(botAction.log);
      if (afterBotPlayerHp <= 0) {
        newLogs.push(`${playerCard.common_name} is too tired to continue.`);
        set({ playerHp: 0, log: [...newLogs], outcome: "lose", isAttacking: false });
        void recordBattleResult(false, round);
      } else {
        set({ playerHp: afterBotPlayerHp, log: [...newLogs], round: round + 1, isAttacking: false });
      }
    }, 500);
  },

  giveUp: () => {
    const { playerCard, isAttacking, outcome, round } = get();
    if (!playerCard || isAttacking || outcome !== "playing") return;
    set((state) => ({
      playerHp: 0,
      log: [...state.log, `You stopped the battle. ${playerCard.common_name} went back to rest.`],
      outcome: "lose",
      giveUpConfirmVisible: false,
    }));
    void recordBattleResult(false, round);
  },

  battleAgain: () => {
    const { playerCard } = get();
    if (playerCard) void get().startBattle(playerCard);
  },

  selectAnotherCard: () => useNavigationStore.getState().resetTo("battle_select"),

  openGiveUpConfirm: () => set({ giveUpConfirmVisible: true }),
  closeGiveUpConfirm: () => set({ giveUpConfirmVisible: false }),
}));
