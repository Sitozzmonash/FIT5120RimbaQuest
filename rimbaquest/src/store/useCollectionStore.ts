import { create } from "zustand";

type CollectionState = {
  filter: string;
};

type CollectionActions = {
  setFilter: (filter: string) => void;
};

export const useCollectionStore = create<CollectionState & CollectionActions>(
  (set) => ({
    filter: "All",
    setFilter: (filter) => set({ filter }),
  }),
);
