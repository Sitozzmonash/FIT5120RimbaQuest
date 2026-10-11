import { create } from "zustand";

export type ScreenGuideTopic = "profile" | "discover" | "capture" | "collection" | "species" | "battle";

type ScreenGuideState = {
  topic: ScreenGuideTopic | null;
  openGuide: (topic: ScreenGuideTopic) => void;
  closeGuide: () => void;
};

export const useScreenGuideStore = create<ScreenGuideState>((set) => ({
  topic: null,
  openGuide: (topic) => set({ topic }),
  closeGuide: () => set({ topic: null }),
}));
