import React from "react";
import { Controller, useFormContext } from "react-hook-form";
import { AuthTextField } from "../../auth/AuthTextField";
import { AccountFormValues } from "../accountFormTypes";

export function ConfirmPasswordField() {
  const { control, getValues } = useFormContext<AccountFormValues>();

  return (
    <Controller
      control={control}
      name="confirmPassword"
      rules={{
        required: "Please type your password again.",
        validate: (value) =>
          value === getValues("password") || "Passwords do not match.",
      }}
      render={({ field: { value, onChange, onBlur }, fieldState }) => (
        <AuthTextField
          label="Confirm Password *"
          icon="lock-outline"
          password
          placeholder="Type the same password"
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
