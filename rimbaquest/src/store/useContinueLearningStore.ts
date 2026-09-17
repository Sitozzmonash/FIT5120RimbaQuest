import { create } from "zustand";
import {
  ActivityEntry,
  ActivityType,
  loadActivityEntries,
  saveActivityEntries,
} from "../constants/continueLearningStorage";

type ContinueLearningState = {
  childId: number | null;
  entries: ActivityEntry[];
};

type ContinueLearningActions = {
  loadForChild: (childId: number) => Promise<void>;
  recordActivity: (
    childId: number,
    speciesId: string,
    activityType: ActivityType,
  ) => void;
  clear: () => void;
};

export type ContinueLearningStore = ContinueLearningState &
  ContinueLearningActions;

function upsert(
  entries: ActivityEntry[],
  ...next: ActivityEntry[]
): ActivityEntry[] {
  const bySpecies = new Map<string, ActivityEntry>();
  for (const entry of [...entries, ...next]) {
    const existing = bySpecies.get(entry.speciesId);
    if (!existing || entry.lastInteractedAt > existing.lastInteractedAt) {
      bySpecies.set(entry.speciesId, entry);
    }
  }
  return [...bySpecies.values()].sort(
    (a, b) => b.lastInteractedAt - a.lastInteractedAt,
  );
}

let loadRequestSeq = 0;

export const useContinueLearningStore = create<ContinueLearningStore>(
  (set, get) => ({
    childId: null,
    entries: [],

    loadForChild: async (childId) => {
      const requestId = ++loadRequestSeq;
      if (!childId) {
        set({ childId: null, entries: [] });
        return;
      }
      const loaded = await loadActivityEntries(childId);
      if (requestId !== loadRequestSeq) return;
      set((state) => ({
        childId,
        entries: upsert(
          state.childId === childId ? state.entries : [],
          ...loaded,
        ),
      }));
    },

    recordActivity: (childId, speciesId, activityType) => {
      if (!childId) return;
      const entry: ActivityEntry = {
        speciesId,
        activityType,
        lastInteractedAt: Date.now(),
      };
      set((state) => ({
        childId,
        entries: upsert(state.childId === childId ? state.entries : [], entry),
      }));
      void saveActivityEntries(childId, get().entries);
    },

    clear: () => set({ childId: null, entries: [] }),
  }),
);
