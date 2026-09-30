import React from "react";
import { Controller, useFormContext } from "react-hook-form";
import { EMAIL_RE } from "../../../../constants/validation";
import { AuthTextField } from "../../auth/AuthTextField";
import { AccountFormValues } from "../accountFormTypes";

export function EmailField() {
  const { control } = useFormContext<AccountFormValues>();

  return (
    <Controller
      control={control}
      name="email"
      rules={{
        required: "Please enter an email address.",
        pattern: {
          value: EMAIL_RE,
          message: "That email does not look right. Please check it.",
        },
      }}
      render={({ field: { value, onChange, onBlur }, fieldState }) => (
        <AuthTextField
          compact
          label="Email Address *"
          icon="mail-outline"
          placeholder="name@example.com"
          value={value}
          onChangeText={onChange}
          onBlur={onBlur}
          error={fieldState.error?.message}
          autoCapitalize="none"
          keyboardType="email-address"
          autoComplete="email"
        />
      )}
    />
  );
}
