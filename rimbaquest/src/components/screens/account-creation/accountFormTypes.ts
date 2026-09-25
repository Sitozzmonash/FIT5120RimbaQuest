export type AccountFormValues = {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  avatar: string;
  age: number | null;
};

export const accountFormDefaultValues: AccountFormValues = {
  username: "",
  email: "",
  password: "",
  confirmPassword: "",
  avatar: "hornbill",
  age: null,
};
