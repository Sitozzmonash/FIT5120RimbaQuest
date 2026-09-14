import { create } from "zustand";

type CollectionState = {
  filter: string;
  search: string;
};

type CollectionActions = {
  setFilter: (filter: string) => void;
  setSearch: (search: string) => void;
};

export const useCollectionStore = create<CollectionState & CollectionActions>(
  (set) => ({
    filter: "All",
    search: "",
    setFilter: (filter) => set({ filter }),
    setSearch: (search) => set({ search }),
  }),
);
