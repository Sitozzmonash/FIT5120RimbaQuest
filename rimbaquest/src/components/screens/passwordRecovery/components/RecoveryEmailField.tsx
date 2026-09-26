import React from "react";
import { useForgotPasswordStore } from "../../../../store/useForgotPasswordStore";
import { AuthTextField } from "../../auth/AuthTextField";

export function RecoveryEmailField({
  showError = true,
  onSubmitEditing,
}: {
  showError?: boolean;
  onSubmitEditing?: () => void;
}) {
  const email = useForgotPasswordStore((state) => state.email);
  const fieldError = useForgotPasswordStore((state) => state.fieldError);

  return (
    <AuthTextField
      label="Your Account Email Address"
      icon="mail-outline"
      placeholder="name@example.com"
      value={email}
      onChangeText={useForgotPasswordStore.getState().setEmail}
      error={showError ? fieldError : null}
      autoCapitalize="none"
      keyboardType="email-address"
      autoComplete="email"
      onSubmitEditing={onSubmitEditing}
    />
  );
}
