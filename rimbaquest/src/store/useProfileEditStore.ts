import { create } from "zustand";
import { UserProfile } from "../types";

type ProfileEditState = {
  displayName: string;
  avatar: string;
  age: string;
  originalUsername: string;
  originalAvatar: string;
  error: string | null;
  saving: boolean;
};

type ProfileEditActions = {
  setDisplayName: (displayName: string) => void;
  setAvatar: (avatar: string) => void;
  setError: (error: string | null) => void;
  setSaving: (saving: boolean) => void;
  startEditing: (user: UserProfile) => void;
  reset: () => void;
};

export type ProfileEditStore = ProfileEditState & ProfileEditActions;

const initialState: ProfileEditState = {
  displayName: "",
  avatar: "",
  age: "",
  originalUsername: "",
  originalAvatar: "",
  error: null,
  saving: false,
};

export const useProfileEditStore = create<ProfileEditStore>((set) => ({
  ...initialState,

  setDisplayName: (displayName) => set({ displayName }),
  setAvatar: (avatar) => set({ avatar }),
  setError: (error) => set({ error }),
  setSaving: (saving) => set({ saving }),

  startEditing: (user) =>
    set({
      displayName: user.username,
      avatar: user.avatar,
      age: String(user.age),
      originalUsername: user.username,
      originalAvatar: user.avatar,
      error: null,
      saving: false,
    }),

  reset: () => set(initialState),
}));
