import { create } from "zustand";

type ForgotPasswordState = {
  email: string;
  token: string;
  newPassword: string;
  confirmPassword: string;
  fieldError: string | null;
  formError: string | null;
  submitting: boolean;
};

type ForgotPasswordActions = {
  setEmail: (email: string) => void;
  setToken: (token: string) => void;
  setNewPassword: (newPassword: string) => void;
  setConfirmPassword: (confirmPassword: string) => void;
  setFieldError: (fieldError: string | null) => void;
  setFormError: (formError: string | null) => void;
  setSubmitting: (submitting: boolean) => void;
  reset: () => void;
};

export type ForgotPasswordStore = ForgotPasswordState & ForgotPasswordActions;

const initialState: ForgotPasswordState = {
  email: "",
  token: "",
  newPassword: "",
  confirmPassword: "",
  fieldError: null,
  formError: null,
  submitting: false,
};

export const useForgotPasswordStore = create<ForgotPasswordStore>((set) => ({
  ...initialState,

  setEmail: (email) => set({ email }),
  setToken: (token) => set({ token }),
  setNewPassword: (newPassword) => set({ newPassword }),
  setConfirmPassword: (confirmPassword) => set({ confirmPassword }),
  setFieldError: (fieldError) => set({ fieldError }),
  setFormError: (formError) => set({ formError }),
  setSubmitting: (submitting) => set({ submitting }),

  reset: () => set(initialState),
}));
