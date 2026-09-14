import { Platform } from "react-native";
import * as Location from "expo-location";
import { create } from "zustand";
import { API_BASE } from "../constants/config";
import {
  IdentificationFeedback,
  LocationMode,
  Species,
  VerificationError,
} from "../types";
import { apiMessage } from "../utils/authApi";

type DiscoveryState = {
  photoUri: string | null;
  photoError: string | null;
  verifyingPhoto: boolean;
  verificationError: VerificationError | null;
  verificationId: string | null;
  verificationCandidates: Species[];
  verificationPhotoUrl: string | null;
  verificationAttempt: number;
  category: string;
  chosenSpeciesId: string | null;
  evaluatingIdentification: boolean;
  identificationFeedback: IdentificationFeedback | null;
  identificationError: string | null;
  discoveryLocation: string;
  locationMode: LocationMode;
  locationNotice: string | null;
  resolvingLocation: boolean;
  saveError: string | null;
  saving: boolean;
  reportingVerification: boolean;
  firstDiscovery: boolean;
  discoveryXpAwarded: number;
  discoveryRecordedAt: string | null;
};

export type SaveDiscoveryResult = {
  speciesId: string;
  first_discovery: boolean;
  total_xp?: number;
  xp_awarded: number;
  recorded_at: string;
  photo_url: string | null;
  location_label: string;
};

type OnSessionExpired = () => Promise<void>;

type DiscoveryActions = {
  setPhotoError: (error: string | null) => void;
  setCategory: (category: string) => void;
  setIdentificationError: (error: string | null) => void;
  setDiscoveryLocation: (location: string) => void;
  setLocationMode: (mode: LocationMode) => void;

  resetSelections: () => void;
  retake: () => void;
  discard: () => void;

  submitPhoto: (
    uri: string,
    mimeType: string,
    childId: number,
    token: string,
    onSessionExpired: OnSessionExpired,
  ) => Promise<boolean>;

  evaluateIdentification: (
    item: Species,
    childId: number,
    token: string,
    onSessionExpired: OnSessionExpired,
  ) => Promise<void>;

  confirmSpecies: (item: Species) => void;

  useAutomaticLocation: () => Promise<void>;

  reportVerification: (
    childId: number,
    token: string,
    onSessionExpired: OnSessionExpired,
  ) => Promise<boolean>;

  saveDiscovery: (
    speciesId: string,
    childId: number,
    token: string,
    onSessionExpired: OnSessionExpired,
  ) => Promise<SaveDiscoveryResult | null>;
};

export type DiscoveryStore = DiscoveryState & DiscoveryActions;

const initialState: DiscoveryState = {
  photoUri: null,
  photoError: null,
  verifyingPhoto: false,
  verificationError: null,
  verificationId: null,
  verificationCandidates: [],
  verificationPhotoUrl: null,
  verificationAttempt: 0,
  category: "",
  chosenSpeciesId: null,
  evaluatingIdentification: false,
  identificationFeedback: null,
  identificationError: null,
  discoveryLocation: "",
  locationMode: "manual",
  locationNotice: null,
  resolvingLocation: false,
  saveError: null,
  saving: false,
  reportingVerification: false,
  firstDiscovery: true,
  discoveryXpAwarded: 0,
  discoveryRecordedAt: null,
};

function authHeaders(token: string): Record<string, string> {
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function readCurrentLocationLabel(): Promise<string | null> {
  try {
    const servicesEnabled = await Location.hasServicesEnabledAsync();
    if (!servicesEnabled) return null;

    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") return null;

    const position = await Promise.race([
      Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      }),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("timeout")), 8000),
      ),
    ]);

    const { latitude, longitude } = position.coords;
    try {
      const [place] = await Location.reverseGeocodeAsync({
        latitude,
        longitude,
      });
      const label = [
        place?.city || place?.subregion,
        place?.region || place?.country,
      ]
        .filter(Boolean)
        .join(", ");
      if (label) return label;
    } catch {
      // Reverse geocoding can fail independently of the GPS fix (e.g. offline);
      // fall back to coordinates rather than failing the whole lookup.
    }

    if (Platform.OS === "web") return null;

    return `Current location (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`;
  } catch {
    return null;
  }
}

export const useDiscoveryStore = create<DiscoveryStore>((set, get) => ({
  ...initialState,

  setPhotoError: (photoError) => set({ photoError }),
  setCategory: (category) => set({ category }),
  setIdentificationError: (identificationError) => set({ identificationError }),
  setDiscoveryLocation: (discoveryLocation) => set({ discoveryLocation }),

  setLocationMode: (mode) => {
    if (mode === "auto") {
      void get().useAutomaticLocation();
      return;
    }
    set({ locationMode: mode, locationNotice: null });
  },

  resetSelections: () =>
    set({
      category: "",
      chosenSpeciesId: null,
      discoveryLocation: "",
      locationMode: "manual",
      verifyingPhoto: false,
      verificationError: null,
      verificationId: null,
      verificationCandidates: [],
      verificationPhotoUrl: null,
      identificationFeedback: null,
      identificationError: null,
      evaluatingIdentification: false,
      reportingVerification: false,
    }),

  retake: () =>
    set((state) => ({
      verificationAttempt: state.verificationAttempt + 1,
      photoUri: null,
      photoError: null,
      verificationError: null,
      verificationId: null,
      verificationCandidates: [],
      verificationPhotoUrl: null,
      identificationFeedback: null,
      identificationError: null,
    })),

  discard: () =>
    set((state) => ({
      ...initialState,
      verificationAttempt: state.verificationAttempt + 1,
    })),

  submitPhoto: async (uri, mimeType, childId, token, onSessionExpired) => {
    const attempt = get().verificationAttempt + 1;
    set({
      verificationAttempt: attempt,
      photoUri: uri,
      photoError: null,
      verificationError: null,
      verifyingPhoto: true,
      identificationFeedback: null,
      identificationError: null,
    });

    const form = new FormData();
    const ext =
      mimeType === "image/png"
        ? "png"
        : mimeType === "image/webp"
          ? "webp"
          : "jpg";
    if (Platform.OS === "web") {
      const blob = await fetch(uri).then((response) => response.blob());
      form.append("photo", blob, `discovery.${ext}`);
    } else {
      form.append("photo", {
        uri,
        name: `discovery.${ext}`,
        type: mimeType,
      } as unknown as Blob);
    }

    try {
      const response = await fetch(
        `${API_BASE}/api/v1/children/${childId}/discovery-verifications`,
        {
          method: "POST",
          headers: authHeaders(token),
          body: form,
        },
      );
      const data = await response.json().catch(() => ({}));
      if (response.status === 401 || response.status === 403) {
        await onSessionExpired();
        return false;
      }
      if (!response.ok) {
        throw new Error(
          apiMessage(
            data,
            "We couldn't check your wildlife photo right now. Please try again.",
          ),
        );
      }
      if (attempt !== get().verificationAttempt) return false;
      if (data.status !== "verified") {
        set({
          verificationError: {
            kind: "unverified",
            message: String(
              data.message ||
                "We couldn't verify this animal. Please try another wildlife photo.",
            ),
          },
        });
        return false;
      }
      if (
        !data.verification_id ||
        !Array.isArray(data.candidates) ||
        data.candidates.length !== 4
      ) {
        throw new Error(
          "We couldn't check your wildlife photo right now. Please try again.",
        );
      }
      set({
        verificationId: String(data.verification_id),
        verificationCandidates: data.candidates as Species[],
        verificationPhotoUrl:
          typeof data.photo_url === "string" ? data.photo_url : null,
      });
      return true;
    } catch (error) {
      if (attempt !== get().verificationAttempt) return false;
      set({
        verificationError: {
          kind: "failed",
          message:
            error instanceof Error
              ? error.message
              : "We couldn't check your wildlife photo right now. Please try again.",
        },
      });
      return false;
    } finally {
      if (attempt === get().verificationAttempt) set({ verifyingPhoto: false });
    }
  },

  evaluateIdentification: async (item, childId, token, onSessionExpired) => {
    const state = get();
    if (!state.verificationId || state.evaluatingIdentification) return;
    set({
      chosenSpeciesId: item.id,
      evaluatingIdentification: true,
      identificationError: null,
    });
    try {
      const response = await fetch(
        `${API_BASE}/api/v1/children/${childId}/discovery-verifications/${state.verificationId}/evaluate`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...authHeaders(token),
          },
          body: JSON.stringify({
            category: state.category,
            species_id: item.id,
          }),
        },
      );
      const data = await response.json().catch(() => ({}));
      if (response.status === 401 || response.status === 403) {
        await onSessionExpired();
        return;
      }
      if (!response.ok)
        throw new Error(
          apiMessage(
            data,
            "We couldn't check your answer right now. Please try again.",
          ),
        );
      set({ identificationFeedback: data as IdentificationFeedback });
    } catch (error) {
      set({
        identificationError:
          error instanceof Error
            ? error.message
            : "We couldn't check your answer right now. Please try again.",
      });
    } finally {
      set({ evaluatingIdentification: false });
    }
  },

  confirmSpecies: (item) =>
    set({ chosenSpeciesId: item.id, identificationFeedback: null }),

  useAutomaticLocation: async () => {
    set({
      locationMode: "auto",
      locationNotice: null,
      resolvingLocation: true,
    });
    try {
      const label = await readCurrentLocationLabel();
      if (!label) {
        set({
          locationNotice:
            "Your current location cannot be accessed. You can enter or select the location manually.",
          locationMode: "manual",
        });
        return;
      }
      set({ discoveryLocation: label });
    } finally {
      set({ resolvingLocation: false });
    }
  },

  reportVerification: async (childId, token, onSessionExpired) => {
    const state = get();
    if (!state.verificationId || state.reportingVerification || state.saving)
      return false;
    set({ reportingVerification: true, saveError: null });
    try {
      const response = await fetch(
        `${API_BASE}/api/v1/children/${childId}/discovery-verifications/${state.verificationId}/report`,
        { method: "POST", headers: authHeaders(token) },
      );
      const data = await response.json().catch(() => ({}));
      if (response.status === 401 || response.status === 403) {
        await onSessionExpired();
        return false;
      }
      if (!response.ok)
        throw new Error(
          apiMessage(
            data,
            "We couldn't report this result right now. Please try again.",
          ),
        );
      return true;
    } catch (error) {
      set({
        saveError:
          error instanceof Error
            ? error.message
            : "We couldn't report this result right now. Please try again.",
      });
      return false;
    } finally {
      set({ reportingVerification: false });
    }
  },

  saveDiscovery: async (speciesId, childId, token, onSessionExpired) => {
    const state = get();
    if (state.saving) return null;
    if (!state.photoUri) return null;
    if (!state.verificationId) {
      set({
        saveError:
          "This photo has not been verified. Please try another wildlife photo.",
      });
      return null;
    }

    let locationLabel = state.discoveryLocation.trim();
    if (state.locationMode === "auto") {
      locationLabel = locationLabel || (await readCurrentLocationLabel()) || "";
      if (!locationLabel) {
        set({
          locationNotice:
            "Your current location cannot be accessed. You can enter or select the location manually.",
          locationMode: "manual",
        });
        return null;
      }
      set({ discoveryLocation: locationLabel });
    }
    if (!locationLabel) {
      set({ saveError: "Please choose or enter a discovery location." });
      return null;
    }

    set({ saving: true, saveError: null });
    try {
      const response = await fetch(
        `${API_BASE}/api/v1/children/${childId}/discoveries`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...authHeaders(token),
          },
          body: JSON.stringify({
            verification_id: state.verificationId,
            location_label: locationLabel,
          }),
        },
      );
      const responseData = await response.json().catch(() => ({}));
      if (response.status === 401 || response.status === 403) {
        await onSessionExpired();
        return null;
      }
      if (!response.ok)
        throw new Error(
          apiMessage(
            responseData,
            "Your discovery wasn't saved. Please try again.",
          ),
        );

      const result: SaveDiscoveryResult = {
        speciesId,
        first_discovery: Boolean(responseData.first_discovery),
        total_xp:
          typeof responseData.total_xp === "number"
            ? responseData.total_xp
            : undefined,
        xp_awarded: Number(responseData.xp_awarded ?? 0),
        recorded_at: responseData.recorded_at ?? new Date().toISOString(),
        photo_url:
          (responseData.photo_url as string | null | undefined) ??
          state.verificationPhotoUrl ??
          state.photoUri,
        location_label: locationLabel,
      };
      set({
        firstDiscovery: result.first_discovery,
        discoveryXpAwarded: result.xp_awarded,
        discoveryRecordedAt: result.recorded_at,
      });
      return result;
    } catch (error) {
      set({
        saveError:
          error instanceof Error
            ? error.message
            : "Your discovery wasn't saved. Please try again.",
      });
      return null;
    } finally {
      set({ saving: false });
    }
  },
}));
