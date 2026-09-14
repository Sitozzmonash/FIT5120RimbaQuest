import { create } from "zustand";
import { Screen } from "../types";

type NavigationState = {
  screen: Screen;
  history: Screen[];
  fallbackScreen: Screen;
};

type NavigationActions = {
  setScreen: (screen: Screen) => void;
  open: (next: Screen) => void;
  resetTo: (next: Screen) => void;
  goBack: () => void;
  setFallbackScreen: (screen: Screen) => void;
};

export type NavigationStore = NavigationState & NavigationActions;

export const useNavigationStore = create<NavigationStore>((set, get) => ({
  screen: "account_entry",
  history: [],
  fallbackScreen: "account_entry",

  setScreen: (screen) => set({ screen }),

  open: (next) =>
    set((state) => ({
      history: [...state.history, state.screen],
      screen: next,
    })),

  resetTo: (next) => set({ history: [], screen: next }),

  goBack: () => {
    const { history, fallbackScreen } = get();
    const prev = history[history.length - 1];
    set({
      screen: prev ?? fallbackScreen,
      history: history.slice(0, -1),
    });
  },

  setFallbackScreen: (fallbackScreen) => set({ fallbackScreen }),
}));
