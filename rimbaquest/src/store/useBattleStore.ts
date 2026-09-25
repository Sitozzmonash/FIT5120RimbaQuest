import { create } from "zustand";
import { BattleDifficulty, Species } from "../types";
import { useNavigationStore } from "./useNavigationStore";

type BattleStartRequest = {
  card: Species;
  difficulty: BattleDifficulty;
};

type BattleState = {
  playerCard: Species | null;
  difficulty: BattleDifficulty;
  pendingBattle: BattleStartRequest | null;
};

type BattleActions = {
  selectCard: (card: Species | null) => void;
  setDifficulty: (difficulty: BattleDifficulty) => void;
  resetCardSelection: () => void;
  startBattle: (card: Species) => void;
  clearPendingBattle: () => void;
  reset: () => void;
};

export type BattleStore = BattleState & BattleActions;

const initialState: BattleState = {
  playerCard: null,
  difficulty: "standard",
  pendingBattle: null,
};

// Screens share selection and navigation here. useBattleSession owns all
// combat requests, server state, retries, and authoritative XP updates.
export const useBattleStore = create<BattleStore>((set, get) => ({
  ...initialState,

  selectCard: (playerCard) => set({ playerCard }),
  setDifficulty: (difficulty) => set({ difficulty }),
  resetCardSelection: () => set({ playerCard: null }),

  startBattle: (card) => {
    if (get().pendingBattle) return;
    set({
      playerCard: card,
      pendingBattle: { card, difficulty: get().difficulty },
    });
    if (useNavigationStore.getState().screen !== "battle_arena") {
      useNavigationStore.getState().open("battle_arena");
    }
  },

  clearPendingBattle: () => set({ pendingBattle: null }),
  reset: () => set(initialState),
}));
