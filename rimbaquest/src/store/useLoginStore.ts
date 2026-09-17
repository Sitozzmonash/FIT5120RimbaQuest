import { create } from "zustand";

type LoginState = {
  username: string;
  password: string;
  fieldErrors: Record<string, string>;
  authError: string | null;
  submitting: boolean;
};

type LoginActions = {
  setUsername: (username: string) => void;
  setPassword: (password: string) => void;
  setFieldErrors: (fieldErrors: Record<string, string>) => void;
  setAuthError: (authError: string | null) => void;
  setSubmitting: (submitting: boolean) => void;
  reset: () => void;
};

export type LoginStore = LoginState & LoginActions;

const initialState: LoginState = {
  username: "",
  password: "",
  fieldErrors: {},
  authError: null,
  submitting: false,
};

export const useLoginStore = create<LoginStore>((set) => ({
  ...initialState,

  setUsername: (username) => set({ username }),
  setPassword: (password) => set({ password }),
  setFieldErrors: (fieldErrors) => set({ fieldErrors }),
  setAuthError: (authError) => set({ authError }),
  setSubmitting: (submitting) => set({ submitting }),

  reset: () => set(initialState),
}));
