import { create } from "zustand";
import * as Location from "expo-location";
import { DistanceStatus, LocationItem, LocationViewMode } from "../types";
import { API_BASE } from "../constants/config";
import { OFFLINE_LOCATIONS } from '../constants/seed';
import { distanceInKm } from '../utils/locationDiscovery';

type LocationsState = {
  locations: LocationItem[];
  selectedLocation: LocationItem | null;
  search: string;
  categoryFilter: string;
  viewMode: LocationViewMode;
  distances: Record<string, number>;
  distanceStatus: DistanceStatus;
  distanceNotice: string | null;
  offlineNotice: string | null;
  loading: boolean;
  error: string | null;
  detailError: string | null;
};

type LocationsActions = {
  setSearch: (search: string) => void;
  setCategoryFilter: (categoryFilter: string) => void;
  setViewMode: (viewMode: LocationViewMode) => void;
  loadLocations: () => Promise<void>;
  loadLocationDetail: (location: LocationItem) => Promise<void>;
  requestDistances: () => Promise<void>;
};

export type LocationsStore = LocationsState & LocationsActions;

const initialState: LocationsState = {
  locations: [],
  selectedLocation: null,
  search: "",
  categoryFilter: "All",
  viewMode: "list",
  distances: {},
  distanceStatus: "idle",
  distanceNotice: null,
  offlineNotice: null,
  loading: false,
  error: null,
  detailError: null,
};

export const useLocationsStore = create<LocationsStore>((set, get) => ({
  ...initialState,

  setSearch: (search) => set({ search }),
  setCategoryFilter: (categoryFilter) => set({ categoryFilter }),
  setViewMode: (viewMode) => set({ viewMode }),

  loadLocations: async () => {
    set({ loading: true, error: null, offlineNotice: null });

    try {
      const res = await fetch(`${API_BASE}/api/v1/locations`);
      if (!res.ok) throw new Error("Unable to load locations");
      const data = await res.json();
      if (!data.items?.length) {
        set({
          locations: OFFLINE_LOCATIONS,
          offlineNotice: "Showing the saved location guide while the latest list is unavailable.",
        });
      } else {
        set({ locations: data.items });
      }
    } catch {
      set({
        locations: OFFLINE_LOCATIONS,
        offlineNotice: "Showing the saved location guide while the latest list is unavailable.",
      });
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

  requestDistances: async () => {
    set({ distanceStatus: "loading", distanceNotice: null });
    try {
      const enabled = await Location.hasServicesEnabledAsync();
      if (!enabled) {
        set({
          distanceStatus: "unavailable",
          distanceNotice: "Location services are off. You can still browse every place alphabetically.",
        });
        return;
      }
      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status !== "granted") {
        set({
          distanceStatus: "denied",
          distanceNotice: "Location permission was not granted. You can still browse every place alphabetically.",
        });
        return;
      }
      const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const distances: Record<string, number> = {};
      for (const location of get().locations) {
        const distance = distanceInKm(position.coords, location);
        if (distance !== null) distances[location.id] = distance;
      }
      set({ distanceStatus: "available", distances, distanceNotice: null });
    } catch {
      set({
        distanceStatus: "unavailable",
        distanceNotice: "We could not calculate distances right now. You can still browse every place alphabetically.",
      });
    }
  },
}));
