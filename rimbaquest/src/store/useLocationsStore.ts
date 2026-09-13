import { create } from "zustand";
import { LocationItem } from "../types";
import { API_BASE } from "../constants/config";
// import { OFFLINE_LOCATIONS } from '../constants/seed';

type LocationsState = {
  locations: LocationItem[];
  selectedLocation: LocationItem | null;
  search: string;
  categoryFilter: string;
  loading: boolean;
  error: string | null;
  detailError: string | null;
};

type LocationsActions = {
  setSearch: (search: string) => void;
  setCategoryFilter: (categoryFilter: string) => void;
  loadLocations: () => Promise<void>;
  loadLocationDetail: (location: LocationItem) => Promise<void>;
  // useOfflineFallbackIfEmpty: () => void;
};

export type LocationsStore = LocationsState & LocationsActions;

const initialState: LocationsState = {
  locations: [],
  selectedLocation: null,
  search: "",
  categoryFilter: "All",
  loading: false,
  error: null,
  detailError: null,
};

export const useLocationsStore = create<LocationsStore>((set, get) => ({
  ...initialState,

  setSearch: (search) => set({ search }),
  setCategoryFilter: (categoryFilter) => set({ categoryFilter }),

  loadLocations: async () => {
    set({ loading: true, error: null });

    try {
      const res = await fetch(`${API_BASE}/api/v1/locations`);
      if (!res.ok) throw new Error("Unable to load locations");
      const data = await res.json();
      if (!data.items?.length) {
        set({
          locations: [],
          error:
            "We couldn't load wildlife locations right now. Please try again.",
        });
      } else {
        set({ locations: data.items });
      }
    } catch {
      set({
        error:
          "We couldn't load wildlife locations right now. Please try again.",
      });
      // get().useOfflineFallbackIfEmpty();
    } finally {
      set({ loading: false });
    }
  },

  loadLocationDetail: async (location) => {
    set({ selectedLocation: location, detailError: null });
    try {
      const res = await fetch(`${API_BASE}/api/v1/locations/${location.id}`);
      if (!res.ok) throw new Error("fail");
      const data = await res.json();
      set({
        selectedLocation: {
          ...location,
          ...data,
          facilities: Array.isArray(data.facilities)
            ? data.facilities
            : location.facilities,
        },
      });
    } catch {
      if (!location.description) {
        set({
          detailError: "We couldn't load this location. Please try again.",
        });
      }
    }
  },

  // useOfflineFallbackIfEmpty: () =>
  //   set((state) => ({ locations: state.locations.length ? state.locations : OFFLINE_LOCATIONS })),
}));
