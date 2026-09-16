import { Platform } from "react-native";
import * as Location from "expo-location";
import { create } from "zustand";
import { API_BASE } from "../constants/config";
import {
  IdentificationFeedback,
  LocationMode,
  Species,
  VerificationError,
  VerificationErrorKind,
} from "../types";
import { OFFLINE_SPECIES } from "../constants/seed";
import { useNavigationStore } from "./useNavigationStore";
import { useSelectedSpeciesStore } from "./useSelectedSpeciesStore";
import { useUserStore } from "./useUserStore";

type DiscoveryState = {
  photoUri: string | null;
  photoMimeType: string | null;
  photoError: string | null;
  verifyingPhoto: boolean;
  verificationError: VerificationError | null;
  photoCheckStage: PhotoCheckStage | null;
  photoCheckAttempt: number;
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

export type PhotoCheckStage =
  | "uploading"
  | "identifying"
  | "matching"
  | "saving"
  | "done"
  | "unverified"
  | "failed"
  | "cancelled";

export type SaveDiscoveryResult = {
  speciesId: string;
  first_discovery: boolean;
  total_xp?: number;
  xp_awarded: number;
  recorded_at: string;
  photo_url: string | null;
  location_label: string;
};

type DiscoveryActions = {
  setPhotoError: (error: string | null) => void;
  setCategory: (category: string) => void;
  setIdentificationError: (error: string | null) => void;
  setDiscoveryLocation: (location: string) => void;
  setLocationMode: (mode: LocationMode) => void;

  resetSelections: () => void;
  retake: () => void;
  discard: () => void;

  submitPhoto: (uri: string, mimeType: string) => Promise<boolean>;
  retryPhoto: () => Promise<void>;

  evaluateIdentification: (item: Species) => Promise<void>;

  confirmSpecies: (item: Species) => void;

  useAutomaticLocation: () => Promise<void>;

  reportVerification: () => Promise<boolean>;

  saveDiscovery: (speciesId: string) => Promise<SaveDiscoveryResult | null>;

  start: (presetLocation?: string) => void;
  capturePhoto: (uri: string, mimeType?: string) => void;
  discardAndExit: () => void;
  continueToConfirm: (item: Species) => void;
  confirmAndSave: () => Promise<boolean>;
  reportAndExit: () => Promise<boolean>;
};

export type DiscoveryStore = DiscoveryState & DiscoveryActions;

let activePhotoVerification: AbortController | null = null;
let activePhotoVerificationTraceId: string | null = null;

function cancelActivePhotoVerification(): void {
  activePhotoVerification?.abort();
  activePhotoVerification = null;
  if (activePhotoVerificationTraceId) {
    const traceId = activePhotoVerificationTraceId;
    activePhotoVerificationTraceId = null;
    const { currentUser, authHeaders } = useUserStore.getState();
    void fetch(
      `${API_BASE}/api/v1/children/${currentUser.id}/discovery-verifications/status/${traceId}`,
      { method: "DELETE", headers: authHeaders() },
    ).catch(() => {});
  }
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const PHOTO_CHECK_POLL_INTERVAL_MS = 700;

const initialState: DiscoveryState = {
  photoUri: null,
  photoMimeType: null,
  photoError: null,
  verifyingPhoto: false,
  verificationError: null,
  photoCheckStage: null,
  photoCheckAttempt: 0,
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

  resetSelections: () => {
    cancelActivePhotoVerification();
    set({
      category: "",
      chosenSpeciesId: null,
      discoveryLocation: "",
      locationMode: "manual",
      verifyingPhoto: false,
      verificationError: null,
      photoCheckStage: null,
      photoCheckAttempt: 0,
      verificationId: null,
      verificationCandidates: [],
      verificationPhotoUrl: null,
      identificationFeedback: null,
      identificationError: null,
      evaluatingIdentification: false,
      reportingVerification: false,
    });
  },

  retake: () => {
    cancelActivePhotoVerification();
    set((state) => ({
      verificationAttempt: state.verificationAttempt + 1,
      photoUri: null,
      photoMimeType: null,
      photoError: null,
      verificationError: null,
      photoCheckStage: null,
      photoCheckAttempt: 0,
      verificationId: null,
      verificationCandidates: [],
      verificationPhotoUrl: null,
      identificationFeedback: null,
      identificationError: null,
      verifyingPhoto: false,
    }));
  },

  discard: () => {
    cancelActivePhotoVerification();
    set((state) => ({
      ...initialState,
      verificationAttempt: state.verificationAttempt + 1,
    }));
  },

  submitPhoto: async (uri, mimeType) => {
    const { currentUser, authHeaders } = useUserStore.getState();
    const childId = currentUser.id;
    cancelActivePhotoVerification();
    const controller = new AbortController();
    activePhotoVerification = controller;
    const attempt = get().verificationAttempt + 1;
    set({
      verificationAttempt: attempt,
      photoUri: uri,
      photoMimeType: mimeType,
      photoError: null,
      verificationError: null,
      photoCheckStage: "uploading",
      photoCheckAttempt: 0,
      verifyingPhoto: true,
      verificationId: null,
      verificationCandidates: [],
      verificationPhotoUrl: null,
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

    if (controller.signal.aborted || attempt !== get().verificationAttempt) {
      return false;
    }

    try {
      const response = await fetch(
        `${API_BASE}/api/v1/children/${childId}/discovery-verifications`,
        {
          method: "POST",
          headers: authHeaders(),
          body: form,
          signal: controller.signal,
        },
      );
      const data = await response.json().catch(() => ({}));
      if (response.status === 401 || response.status === 403) {
        await useUserStore.getState().expire();
        return false;
      }
      if (
        response.status === 415 ||
        response.status === 400 ||
        response.status === 413
      ) {
        set({
          verificationError: {
            kind: "unsupported_file",
            message:
              typeof data.detail === "string"
                ? data.detail
                : "This file isn't a wildlife photo we can check.",
          },
        });
        return false;
      }
      if (!response.ok || data.status !== "pending" || !data.trace_id) {
        throw new Error(
          "We couldn't check your wildlife photo right now. Please try again.",
        );
      }
      if (attempt !== get().verificationAttempt) return false;
      activePhotoVerificationTraceId = String(data.trace_id);

      // The backend runs identification as a background job and reports its
      // real stage here; this polls that instead of guessing with a timer.
      while (true) {
        await wait(PHOTO_CHECK_POLL_INTERVAL_MS);
        if (controller.signal.aborted || attempt !== get().verificationAttempt) {
          return false;
        }
        let statusResponse: Response;
        try {
          statusResponse = await fetch(
            `${API_BASE}/api/v1/children/${childId}/discovery-verifications/status/${activePhotoVerificationTraceId}`,
            { headers: authHeaders(), signal: controller.signal },
          );
        } catch {
          if (controller.signal.aborted) return false;
          continue;
        }
        if (statusResponse.status === 401 || statusResponse.status === 403) {
          await useUserStore.getState().expire();
          return false;
        }
        if (!statusResponse.ok) {
          throw new Error(
            "We couldn't check your wildlife photo right now. Please try again.",
          );
        }
        const statusData = await statusResponse.json().catch(() => ({}));
        if (attempt !== get().verificationAttempt) return false;

        const stage: PhotoCheckStage | undefined = statusData.stage;
        set({
          photoCheckStage: stage ?? null,
          photoCheckAttempt:
            typeof statusData.attempt === "number" ? statusData.attempt : 0,
        });

        if (stage === "cancelled") return false;
        if (stage === "failed") {
          set({
            verificationError: {
              kind: "failed",
              message:
                typeof statusData.message === "string"
                  ? statusData.message
                  : "We couldn't check your wildlife photo right now. Please try again.",
            },
          });
          return false;
        }
        if (stage === "unverified") {
          const reason: string =
            typeof statusData.reason === "string"
              ? statusData.reason
              : "no_animal_detected";
          const kind: VerificationErrorKind =
            reason === "low_confidence" || reason === "species_not_in_catalog"
              ? reason
              : "no_animal_detected";
          set({
            verificationError: {
              kind,
              message:
                typeof statusData.message === "string"
                  ? statusData.message
                  : "We couldn't find an animal in this photo. Please try a clearer wildlife photo.",
            },
          });
          return false;
        }
        if (stage === "done") {
          if (
            !statusData.verification_id ||
            !Array.isArray(statusData.candidates) ||
            statusData.candidates.length !== 4
          ) {
            throw new Error(
              "We couldn't check your wildlife photo right now. Please try again.",
            );
          }
          const candidates = statusData.candidates as Species[];
          set({
            verificationId: String(statusData.verification_id),
            verificationCandidates: candidates,
            verificationPhotoUrl:
              typeof statusData.photo_url === "string"
                ? statusData.photo_url
                : null,
            category: candidates[0]?.category ?? "",
          });
          return true;
        }
        // Still "uploading" / "identifying" / "matching" / "saving": keep polling.
      }
    } catch (error) {
      if (controller.signal.aborted || attempt !== get().verificationAttempt) {
        return false;
      }
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
      if (activePhotoVerification === controller) {
        activePhotoVerification = null;
        activePhotoVerificationTraceId = null;
      }
      if (attempt === get().verificationAttempt) set({ verifyingPhoto: false });
    }
  },

  retryPhoto: async () => {
    const state = get();
    if (!state.photoUri || state.verifyingPhoto) return;

    // The preview screen shows a popup once verification finishes, and the
    // popup's button continues to the species screen.
    await get().submitPhoto(
      state.photoUri,
      state.photoMimeType ?? "image/jpeg",
    );
  },

  evaluateIdentification: async (item) => {
    const { currentUser, authHeaders } = useUserStore.getState();
    const childId = currentUser.id;
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
            ...authHeaders(),
          },
          body: JSON.stringify({
            category: state.category,
            species_id: item.id,
          }),
        },
      );
      const data = await response.json().catch(() => ({}));
      if (response.status === 401 || response.status === 403) {
        await useUserStore.getState().expire();
        return;
      }
      if (!response.ok)
        throw new Error(
          "We couldn't check your answer right now. Please try again.",
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

  reportVerification: async () => {
    const { currentUser, authHeaders } = useUserStore.getState();
    const childId = currentUser.id;
    const state = get();
    if (!state.verificationId || state.reportingVerification || state.saving)
      return false;
    set({ reportingVerification: true, saveError: null });
    try {
      const response = await fetch(
        `${API_BASE}/api/v1/children/${childId}/discovery-verifications/${state.verificationId}/report`,
        { method: "POST", headers: authHeaders() },
      );
      await response.json().catch(() => ({}));
      if (response.status === 401 || response.status === 403) {
        await useUserStore.getState().expire();
        return false;
      }
      if (!response.ok)
        throw new Error(
          "We couldn't send your answer right now. Please try again.",
        );
      return true;
    } catch (error) {
      set({
        saveError:
          error instanceof Error
            ? error.message
            : "We couldn't send your answer right now. Please try again.",
      });
      return false;
    } finally {
      set({ reportingVerification: false });
    }
  },

  saveDiscovery: async (speciesId) => {
    const { currentUser, authHeaders } = useUserStore.getState();
    const childId = currentUser.id;
    const state = get();
    if (state.saving) return null;
    if (!state.photoUri) return null;
    if (!state.verificationId) {
      set({
        saveError:
          "We haven't checked this photo. Please try another wildlife photo.",
      });
      return null;
    }

    let locationLabel = state.discoveryLocation.trim();
    if (state.locationMode === "auto") {
      locationLabel = locationLabel || (await readCurrentLocationLabel()) || "";
      if (!locationLabel) {
        set({
          locationNotice:
            "We can't find where you are. Please choose or type a place.",
          locationMode: "manual",
        });
        return null;
      }
      set({ discoveryLocation: locationLabel });
    }
    if (!locationLabel) {
      set({ saveError: "Please choose or type where you found the animal." });
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
            ...authHeaders(),
          },
          body: JSON.stringify({
            verification_id: state.verificationId,
            location_label: locationLabel,
          }),
        },
      );
      const responseData = await response.json().catch(() => ({}));
      if (response.status === 401 || response.status === 403) {
        await useUserStore.getState().expire();
        return null;
      }
      if (!response.ok)
        throw new Error("We couldn't save your animal. Please try again.");

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
            : "We couldn't save your animal. Please try again.",
      });
      return null;
    } finally {
      set({ saving: false });
    }
  },

  start: (presetLocation) => {
    get().resetSelections();
    useSelectedSpeciesStore.getState().setSelected(OFFLINE_SPECIES[0]);
    if (presetLocation) get().setDiscoveryLocation(presetLocation);
    useNavigationStore.getState().resetTo("photo");
  },

  capturePhoto: (uri, mimeType = "image/jpeg") => {
    useNavigationStore.getState().open("photo_preview");
    // Don't jump straight to the species screen: the preview screen shows a
    // success popup and the user taps its button to continue.
    void get().submitPhoto(uri, mimeType);
  },

  discardAndExit: () => {
    get().discard();
    useSelectedSpeciesStore.getState().setSelected(OFFLINE_SPECIES[0]);
    useNavigationStore.getState().resetTo("home");
  },

  continueToConfirm: (item) => {
    get().confirmSpecies(item);
    useSelectedSpeciesStore.getState().setSelected(item);
    useNavigationStore.getState().open("confirm");
  },

  confirmAndSave: async () => {
    const speciesId = useSelectedSpeciesStore.getState().selected.id;
    const result = await get().saveDiscovery(speciesId);
    if (!result) return false;
    useUserStore.getState().recordDiscoverySaved(speciesId, result);
    await useUserStore.getState().refreshProfile();
    useNavigationStore.getState().open("success");
    return true;
  },

  reportAndExit: async () => {
    const reported = await get().reportVerification();
    if (!reported) return false;
    get().discardAndExit();
    useUserStore
      .getState()
      .setNotice(
        "Thanks for telling us. We did not save the photo or add a card.",
      );
    return true;
  },
}));
