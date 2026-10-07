import { create } from "zustand";
import * as Location from "expo-location";
import { DistanceStatus, LocationItem, LocationViewMode } from "../types";
import { API_BASE } from "../constants/config";
import { OFFLINE_LOCATIONS } from '../constants/seed';
import { DistanceFilter, distanceInKm, LocationSort } from '../utils/locationDiscovery';

type LocationsState = {
  locations: LocationItem[];
  selectedLocation: LocationItem | null;
  search: string;
  categoryFilter: string;
  distanceFilter: DistanceFilter;
  sortBy: LocationSort;
  viewMode: LocationViewMode;
  distances: Record<string, number>;
  distanceStatus: DistanceStatus;
  distanceNotice: string | null;
  locationBlocked: boolean;
  livePosition: Position | null;
  sessionConsent: boolean;
  offlineNotice: string | null;
  loading: boolean;
  error: string | null;
  detailError: string | null;
};

type LocationsActions = {
  setSearch: (search: string) => void;
  setCategoryFilter: (categoryFilter: string) => void;
  setDistanceFilter: (distanceFilter: DistanceFilter) => void;
  setSortBy: (sortBy: LocationSort) => void;
  setViewMode: (viewMode: LocationViewMode) => void;
  loadLocations: () => Promise<void>;
  loadLocationDetail: (location: LocationItem) => Promise<void>;
  /** Resolves to the device position for one-off use (e.g. centring the map); it is never stored. */
  requestDistances: () => Promise<Position | null>;
  /** Stops live location updates (on logout). */
  stopLocationUpdates: () => void;
  /** Quietly restarts location on entering Locations if it was shared this session but is not running. */
  resumeLocationUpdates: () => Promise<void>;
};

type Position = { latitude: number; longitude: number };

// Live updates: at most every 15 s, and only after moving ~50 m.
const WATCH_OPTIONS: Location.LocationOptions = {
  accuracy: Location.Accuracy.Balanced,
  distanceInterval: 50,
  timeInterval: 15000,
};
let watchSubscription: Location.LocationSubscription | null = null;

function distancesFrom(position: Position, locations: LocationItem[]): Record<string, number> {
  const distances: Record<string, number> = {};
  for (const location of locations) {
    const distance = distanceInKm(position, location);
    if (distance !== null) distances[location.id] = distance;
  }
  return distances;
}

export type LocationsStore = LocationsState & LocationsActions;

const initialState: LocationsState = {
  locations: [],
  selectedLocation: null,
  search: "",
  categoryFilter: "All",
  distanceFilter: "any",
  sortBy: "alphabetical",
  viewMode: "list",
  distances: {},
  distanceStatus: "idle",
  distanceNotice: null,
  locationBlocked: false,
  livePosition: null,
  sessionConsent: false,
  offlineNotice: null,
  loading: false,
  error: null,
  detailError: null,
};

export const useLocationsStore = create<LocationsStore>((set, get) => ({
  ...initialState,

  setSearch: (search) => set({ search }),
  setCategoryFilter: (categoryFilter) => set({ categoryFilter }),
  setDistanceFilter: (distanceFilter) => set({ distanceFilter }),
  setSortBy: (sortBy) => set({ sortBy }),
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
        return null;
      }

      // Requested on every tap, so a refusal is never treated as final by the app.
      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status !== "granted") {
        const blocked = !permission.canAskAgain;
        set({
          distanceStatus: "denied",
          locationBlocked: blocked,
          distanceNotice: blocked
            ? "Location is turned off for RimbaQuest. Tap Share location to turn it on in Settings."
            : "No problem! Tap Share location any time to find the nearest places.",
        });
        return null;
      }

      const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const current = { latitude: position.coords.latitude, longitude: position.coords.longitude };

      set({
        distanceStatus: "available",
        distances: distancesFrom(current, get().locations),
        distanceNotice: null,
        locationBlocked: false,
        livePosition: current,
        sessionConsent: true,
      });

      // Keep following the explorer while the app is open.
      if (!watchSubscription) {
        try {
          watchSubscription = await Location.watchPositionAsync(WATCH_OPTIONS, (update) => {
            const next = { latitude: update.coords.latitude, longitude: update.coords.longitude };
            set({ livePosition: next, distances: distancesFrom(next, get().locations) });
          });
          // Leaving the screens while the watch was starting: stop it straight away.
          if (!get().livePosition) get().stopLocationUpdates();
        } catch {
          // Live updates are a bonus; the one-off position above still works.
        }
      }

      return current;

    } catch {
      set({
        distanceStatus: "unavailable",
        distanceNotice: "We could not calculate distances right now. You can still browse every place alphabetically.",
      });
      return null;
    }
  },

  resumeLocationUpdates: async () => {
    if (!get().sessionConsent || get().livePosition) return;
    try {
      // Check only: never show the system prompt without the explainer pop-up.
      const permission = await Location.getForegroundPermissionsAsync();
      if (!permission.granted) {
        set({ sessionConsent: false });
        return;
      }
    } catch {
      set({ sessionConsent: false });
      return;
    }
    const position = await get().requestDistances();
    // Could not restart (e.g. location services off): ask again next time.
    if (!position) set({ sessionConsent: false });
  },

  stopLocationUpdates: () => {
    watchSubscription?.remove();
    watchSubscription = null;
    set({ livePosition: null });
  },
}));
