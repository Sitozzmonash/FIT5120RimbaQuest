import { create } from "zustand";
import { Species } from "../types";
import { OFFLINE_SPECIES } from "../constants/seed";

type SelectedSpeciesStore = {
  selected: Species;
  setSelected: (species: Species) => void;
};

export const useSelectedSpeciesStore = create<SelectedSpeciesStore>((set) => ({
  selected: OFFLINE_SPECIES[0],
  setSelected: (selected) => set({ selected }),
}));
