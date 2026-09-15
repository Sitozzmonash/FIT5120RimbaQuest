import { create } from "zustand";
import { API_BASE } from "../constants/config";
import { DEFAULT_AVATAR } from "../constants/images";
import { clearSession, loadSession, saveSession } from "../constants/session";
import {
  GalleryItem,
  RecentCapture,
  Screen,
  SpeciesChatCitation,
  SpeciesChatResponse,
  UserProfile,
} from "../types";
import { useContinueLearningStore } from "./useContinueLearningStore";
import { useLocationsStore } from "./useLocationsStore";
import { useLoginStore } from "./useLoginStore";
import { useNavigationStore } from "./useNavigationStore";

export const GUEST_USER: UserProfile = {
  id: 0,
  username: "",
  email: "",
  display_name: "Explorer",
  avatar: DEFAULT_AVATAR,
  age: 10,
  age_band: "8-11",
  xp: 0,
  level: 1,
};

const CHAT_SERVICE_FAILURE_MESSAGE =
  "I couldn’t answer that right now. Please try again.";

function isHttpPhotoUrl(url?: string | null): boolean {
  return Boolean(url && /^https?:\/\//i.test(url));
}

type DiscoverySaveResult = {
  first_discovery: boolean;
  total_xp?: number;
  photo_url: string | null;
  location_label: string;
};

type UserState = {
  currentUser: UserProfile;
  isLoggedIn: boolean;
  accessToken: string;
  discovered: string[];
  recentCaptures: RecentCapture[];
  galleryPhotos: Record<string, GalleryItem[]>;
  notice: string | null;

  // True once the app has finished trying to restore a saved session, so
  // the app shell knows when to stop showing its boot spinner.
  bootstrapped: boolean;
  // True while refreshProfile()'s collection/profile/recent-captures/
  // locations fetch is in flight
  profileLoading: boolean;
};

type UserActions = {
  authHeaders: () => Record<string, string>;

  // Called once at app start: tries to restore a saved session and
  // navigates to the right starting screen either way.
  restoreSession: () => Promise<void>;

  applyUser: (user: UserProfile, token: string, nextScreen?: Screen) => void;
  expire: () => Promise<void>;
  logout: () => void;

  updateCurrentUser: (patch: Partial<UserProfile>) => void;
  applyProfileUpdate: (
    data: Partial<UserProfile>,
    submittedUsername: string,
  ) => void;

  // Re-fetches collection/profile/recent-captures/locations for the
  // signed-in user (not the species catalog, which is public and
  // fetched independently).
  refreshProfile: () => Promise<void>;
  refreshRecentCaptures: () => Promise<void>;

  setNotice: (notice: string | null) => void;
  recordDiscoverySaved: (
    speciesId: string,
    result: DiscoverySaveResult,
  ) => void;

  loadSpeciesGallery: (speciesId: string) => Promise<void>;
  chatWithSpecies: (
    speciesId: string,
    question: string,
  ) => Promise<SpeciesChatResponse>;
};

export type UserStore = UserState & UserActions;

function resetAuthForm() {
  useLoginStore.getState().reset();
}

export const useUserStore = create<UserStore>((set, get) => ({
  currentUser: GUEST_USER,
  isLoggedIn: false,
  accessToken: "",
  discovered: [],
  recentCaptures: [],
  galleryPhotos: {},
  notice: null,
  bootstrapped: false,
  profileLoading: false,

  authHeaders: () => {
    const { accessToken } = get();
    const headers: Record<string, string> = {};
    if (accessToken) headers.Authorization = `Bearer ${accessToken}`;
    return headers;
  },

  restoreSession: async () => {
    const saved = await loadSession();
    if (saved?.user?.id && saved.accessToken) {
      set({
        currentUser: saved.user,
        accessToken: saved.accessToken,
        galleryPhotos: {},
        isLoggedIn: true,
      });
      useNavigationStore.getState().resetTo("home");
      void get().refreshProfile();
      void useContinueLearningStore.getState().loadForChild(saved.user.id);
    } else {
      set({ bootstrapped: true });
      useNavigationStore.getState().resetTo("account_entry");
    }
  },

  applyUser: (user, token, nextScreen = "home") => {
    set({
      currentUser: user,
      accessToken: token,
      galleryPhotos: {},
      isLoggedIn: true,
    });
    void saveSession({ user, accessToken: token });
    resetAuthForm();
    useNavigationStore.getState().resetTo(nextScreen);
    void get().refreshProfile();
    void useContinueLearningStore.getState().loadForChild(user.id);
  },

  expire: async () => {
    await clearSession();
    set({
      accessToken: "",
      isLoggedIn: false,
      currentUser: GUEST_USER,
      discovered: [],
      recentCaptures: [],
      galleryPhotos: {},
    });
    resetAuthForm();
    useLoginStore
      .getState()
      .setAuthError("You have been logged out. Please log in again.");
    useNavigationStore.getState().resetTo("login");
    useContinueLearningStore.getState().clear();
  },

  logout: () => {
    void clearSession();
    set({
      accessToken: "",
      isLoggedIn: false,
      currentUser: GUEST_USER,
      discovered: [],
      recentCaptures: [],
      galleryPhotos: {},
      notice: null,
    });
    resetAuthForm();
    useNavigationStore.getState().resetTo("account_entry");
    useContinueLearningStore.getState().clear();
  },

  updateCurrentUser: (patch) => {
    set((state) => {
      const next = { ...state.currentUser, ...patch };
      void saveSession({ user: next, accessToken: state.accessToken });
      return { currentUser: next };
    });
  },

  applyProfileUpdate: (data, submittedUsername) => {
    set((state) => {
      const updatedUsername = String(
        data.username || submittedUsername || state.currentUser.username,
      );
      const next = {
        ...state.currentUser,
        ...data,
        username: updatedUsername,
        display_name: String(data.display_name || updatedUsername),
      };
      void saveSession({ user: next, accessToken: state.accessToken });
      return { currentUser: next };
    });
  },

  refreshProfile: async () => {
    const { currentUser, authHeaders } = get();
    const childId = currentUser.id;
    if (!childId) {
      set({ bootstrapped: true });
      return;
    }
    set({ profileLoading: true });
    try {
      const [collectionRes, profileRes, recentRes] = await Promise.all([
        fetch(`${API_BASE}/api/v1/children/${childId}/collection`, {
          headers: authHeaders(),
        }),
        fetch(`${API_BASE}/api/v1/children/${childId}/profile`, {
          headers: authHeaders(),
        }),
        fetch(`${API_BASE}/api/v1/children/${childId}/recent-captures`, {
          headers: authHeaders(),
        }),
      ]);

      if (profileRes.status === 401 || profileRes.status === 403) {
        await get().expire();
        return;
      }

      if (collectionRes.ok) {
        const data = await collectionRes.json();
        set({
          discovered: data.items
            .filter((item: { discovered: number }) => item.discovered)
            .map((item: { id: string }) => item.id),
        });
      }
      if (profileRes.ok) {
        const data = await profileRes.json();
        get().updateCurrentUser({
          ...data,
          username: String(data.username || currentUser.username),
        });
      }
      if (recentRes.ok) {
        const data = await recentRes.json();
        set({ recentCaptures: data.items });
      }
      await useLocationsStore.getState().loadLocations();
      set({ notice: null });
    } catch {
      set({
        notice:
          "RimbaQuest is offline. New animal photos will be saved when it reconnects.",
      });
    } finally {
      set({ bootstrapped: true, profileLoading: false });
    }
  },

  refreshRecentCaptures: async () => {
    const { currentUser, authHeaders } = get();
    if (!currentUser.id) return;
    try {
      const response = await fetch(
        `${API_BASE}/api/v1/children/${currentUser.id}/recent-captures`,
        { headers: authHeaders() },
      );
      if (response.status === 401 || response.status === 403) {
        await get().expire();
        return;
      }
      if (response.ok) {
        const data = await response.json();
        set({ recentCaptures: data.items });
      }
    } catch {
      // A chat answer may still be visible even if the background refresh
      // cannot update the home card immediately.
    }
  },

  setNotice: (notice) => set({ notice }),

  recordDiscoverySaved: (speciesId, result) => {
    set((state) => ({
      discovered:
        result.first_discovery && !state.discovered.includes(speciesId)
          ? [...state.discovered, speciesId]
          : state.discovered,
      galleryPhotos: {
        ...state.galleryPhotos,
        [speciesId]: [
          {
            photo_url: result.photo_url,
            location_label: result.location_label,
          },
          ...(state.galleryPhotos[speciesId] ?? []),
        ],
      },
    }));
    if (result.first_discovery && typeof result.total_xp === "number") {
      get().updateCurrentUser({ xp: result.total_xp });
    }
    useContinueLearningStore
      .getState()
      .recordActivity(get().currentUser.id, speciesId, "discovery");
  },

  loadSpeciesGallery: async (speciesId) => {
    const { currentUser, authHeaders } = get();
    try {
      const res = await fetch(
        `${API_BASE}/api/v1/children/${currentUser.id}/species/${speciesId}/gallery`,
        { headers: authHeaders() },
      );
      if (res.status === 401 || res.status === 403) {
        await get().expire();
        return;
      }
      if (!res.ok) return;
      const data = await res.json();
      const remote = ((data.items || []) as GalleryItem[]).filter((item) =>
        isHttpPhotoUrl(item.photo_url),
      );
      set((state) => ({
        galleryPhotos: { ...state.galleryPhotos, [speciesId]: remote },
      }));
    } catch {
      // Keep the current in-memory gallery if the remote request is
      // temporarily unavailable.
    }
  },

  chatWithSpecies: async (speciesId, question) => {
    const { currentUser, accessToken, authHeaders } = get();
    if (!currentUser.id || !accessToken) {
      throw new Error("Please log in before using WildGuide.");
    }
    const response = await fetch(
      `${API_BASE}/api/v1/children/${currentUser.id}/species/${encodeURIComponent(speciesId)}/chat`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ question }),
      },
    );
    const data: unknown = await response.json().catch(() => ({}));
    if (response.status === 401 || response.status === 403) {
      await get().expire();
      throw new Error("You have been logged out. Please log in again.");
    }
    if (!response.ok) {
      // Do not render untrusted provider or proxy error details in the child UI.
      throw new Error(CHAT_SERVICE_FAILURE_MESSAGE);
    }
    if (
      !data ||
      typeof data !== "object" ||
      !("answer" in data) ||
      typeof data.answer !== "string" ||
      !data.answer.trim() ||
      !("species_id" in data) ||
      typeof data.species_id !== "string" ||
      data.species_id !== speciesId
    ) {
      // A mismatched response must never appear on the Wildlife Card that is
      // currently open, even if a proxy/cache ever sends the wrong payload.
      throw new Error(CHAT_SERVICE_FAILURE_MESSAGE);
    }
    void get().refreshRecentCaptures();
    useContinueLearningStore.getState().recordActivity(currentUser.id, speciesId, "chat");
    const suggestions =
      "suggested_questions" in data ? data.suggested_questions : undefined;
    const rawCitations = "citations" in data ? data.citations : undefined;
    const citations: SpeciesChatCitation[] | undefined = Array.isArray(rawCitations)
      ? rawCitations
          .slice(0, 3)
          .filter(
            (item): item is Record<string, unknown> =>
              Boolean(item) && typeof item === "object",
          )
          .map((item) => ({
            source_id:
              typeof item.source_id === "string"
                ? item.source_id.trim().slice(0, 40)
                : "",
            source_name:
              typeof item.source_name === "string"
                ? item.source_name.trim().slice(0, 200)
                : "",
            source_url:
              typeof item.source_url === "string" && /^https:\/\//i.test(item.source_url)
                ? item.source_url
                : null,
            excerpt:
              typeof item.excerpt === "string"
                ? item.excerpt.trim().slice(0, 700)
                : "",
          }))
          .filter((item) => item.source_id && item.source_name && item.excerpt)
      : undefined;
    return {
      species_id: data.species_id,
      answer: data.answer,
      suggested_questions: Array.isArray(suggestions)
        ? suggestions.filter((item): item is string => typeof item === "string")
        : undefined,
      citations,
    };
  },
}));
