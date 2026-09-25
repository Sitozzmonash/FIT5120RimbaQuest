import { create } from "zustand";
import { API_BASE } from "../constants/config";
import { OFFLINE_SPECIES } from "../constants/seed";
import { Species } from "../types";

type SpeciesCatalogState = {
  species: Species[];
};

type SpeciesCatalogActions = {
  loadSpecies: () => Promise<void>;
};

export const useSpeciesCatalogStore = create<
  SpeciesCatalogState & SpeciesCatalogActions
>((set) => ({
  species: OFFLINE_SPECIES,

  loadSpecies: async () => {
    try {
      const res = await fetch(`${API_BASE}/api/v1/species`);
      if (res.ok) set({ species: await res.json() });
    } catch {
      // Fall back silently to the offline catalog already in state.
    }
  },
}));
