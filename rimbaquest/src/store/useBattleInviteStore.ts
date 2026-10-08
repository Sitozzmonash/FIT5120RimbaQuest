import { create } from "zustand";

type BattleInviteState = {
  pendingCode: string | null;
  dismissed: string[];
  incomingCount: number;
};

type BattleInviteActions = {
  accept: (matchId: string, code: string) => void;
  dismiss: (matchId: string) => void;
  /** Returns the pending code once and clears it. */
  takePending: () => string | null;
  setIncomingCount: (count: number) => void;
  reset: () => void;
};

export const useBattleInviteStore = create<
  BattleInviteState & BattleInviteActions
>((set, get) => ({
  pendingCode: null,
  dismissed: [],
  incomingCount: 0,

  accept: (matchId, code) =>
    set((state) => ({
      pendingCode: code,
      dismissed: [...state.dismissed, matchId],
    })),
  dismiss: (matchId) =>
    set((state) => ({
      dismissed: state.dismissed.includes(matchId)
        ? state.dismissed
        : [...state.dismissed, matchId],
    })),
  takePending: () => {
    const code = get().pendingCode;
    if (code) set({ pendingCode: null });
    return code;
  },
  setIncomingCount: (incomingCount) => set({ incomingCount }),
  reset: () => set({ pendingCode: null, dismissed: [], incomingCount: 0 }),
}));
