import React from "react";
import { Controller, useFormContext } from "react-hook-form";
import { AuthTextField } from "../../auth/AuthTextField";
import { AccountFormValues } from "../accountFormTypes";

export function PasswordField() {
  const { control } = useFormContext<AccountFormValues>();

  return (
    <Controller
      control={control}
      name="password"
      rules={{
        required: "Please create a password.",
        minLength: {
          value: 6,
          message:
            "Use at least 6 letters, numbers, or symbols for your password.",
        },
      }}
      render={({ field: { value, onChange, onBlur }, fieldState }) => (
        <AuthTextField
          compact
          label="Password *"
          icon="lock-outline"
          password
          placeholder="Create a password"
          value={value}
          onChangeText={onChange}
          onBlur={onBlur}
          error={fieldState.error?.message}
          autoComplete="new-password"
        />
      )}
    />
  );
}
