import React from "react";
import { Controller, useFormContext } from "react-hook-form";
import { AuthTextField } from "../../auth/AuthTextField";
import { AccountFormValues } from "../accountFormTypes";

export function UsernameField() {
  const { control } = useFormContext<AccountFormValues>();

  return (
    <Controller
      control={control}
      name="username"
      rules={{
        required: "Please choose an explorer name.",
        minLength: {
          value: 3,
          message: "Use 3 to 20 letters or numbers for your explorer name.",
        },
        maxLength: {
          value: 20,
          message: "Use 3 to 20 letters or numbers for your explorer name.",
        },
        pattern: {
          value: /^[a-zA-Z0-9_-]+$/,
          message:
            "Use only letters or numbers. You can also use - or _ with no spaces.",
        },
      }}
      render={({ field: { value, onChange, onBlur }, fieldState }) => (
        <AuthTextField
          compact
          label="Explorer Name *"
          icon="person-outline"
          placeholder="For example: JungleHero7"
          value={value}
          onChangeText={onChange}
          onBlur={onBlur}
          error={fieldState.error?.message}
          autoCapitalize="none"
          autoComplete="username"
        />
      )}
    />
  );
}
