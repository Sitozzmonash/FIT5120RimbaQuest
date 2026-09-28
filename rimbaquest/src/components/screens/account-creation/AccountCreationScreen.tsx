import React, { useState } from "react";
import { StyleSheet, Text } from "react-native";
import { FormProvider, useForm } from "react-hook-form";
import { API_BASE } from "../../../constants/config";
import { useLoginStore } from "../../../store/useLoginStore";
import { useNavigationStore } from "../../../store/useNavigationStore";
import { useUserStore } from "../../../store/useUserStore";
import { apiMessage, profileFromAuth } from "../../../utils/authApi";
import {
  AccountFormValues,
  accountFormDefaultValues,
} from "./accountFormTypes";
import { AccountStep } from "./components/AccountStep";
import { AgeStep } from "./components/AgeStep";
import { AuthErrorBanner } from "../auth/AuthErrorBanner";
import { AuthScreen } from "../auth/AuthScreen";
import { authTitleStyle } from "../auth/authTheme";

export function AccountCreationScreen() {
  const [step, setStep] = useState<1 | 2>(1);
  const [authError, setAuthError] = useState<string | null>(null);

  const form = useForm<AccountFormValues>({
    mode: "onBlur",
    defaultValues: accountFormDefaultValues,
  });

  const handleNextFromStep1 = async () => {
    const valid = await form.trigger([
      "username",
      "email",
      "password",
      "confirmPassword",
    ]);
    if (valid) setStep(2);
  };

  const handleRegister = form.handleSubmit(async (values) => {
    // The "age" required rule already blocked submission if this were null;
    // this is just a type guard, not a fallback value.
    if (values.age == null) return;
    setAuthError(null);

    try {
      const res = await fetch(`${API_BASE}/api/v1/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: values.username.trim(),
          age: values.age,
          email: values.email.trim(),
          password: values.password,
          avatar: values.avatar,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        let message = apiMessage(
          data,
          "We couldn't make your account. Please try again.",
        );

        message = message.replace(
          /^String should have at least (\d+) characters?$/i,
          "Use at least $1 letters, numbers, or symbols for your password.",
        );

        if (/email.*(already|registered|exists)/i.test(message)) {
          message = "That email already has an account. Try logging in.";
        }

        if (/username.*(space|letter|number|hyphen|underscore|between)/i.test(message)) {
          message =
            "Use 3 to 20 letters or numbers for your explorer name. You can also use - or _ with no spaces.";
        }

        if (/string should|validation|field required/i.test(message)) {
          message = "Please check each box and try again.";
        }

        if (/already taken/i.test(message)) {
          form.setError("username", {
            type: "server",
            message: "Someone already uses that explorer name. Try another one.",
          });
          setStep(1);
        } else {
          setAuthError(message);
        }

        return;
      }

      const token = String(data.access_token || "");

      if (!token) {
        throw new Error("Registration did not return an access token.");
      }

      useUserStore.getState().applyUser(profileFromAuth(data), token);
    } catch {
      setAuthError("We couldn't make your account. Please try again.");
    }
  });

  return (
    <AuthScreen cardStyle={styles.card} decorations={false}>
      <Text style={authTitleStyle}>
        {step === 1 ? "Create Account" : "How old are you?"}
      </Text>
      <AuthErrorBanner message={authError} />

      <FormProvider {...form}>
        {step === 1 && (
          <AccountStep
            onBack={() => useNavigationStore.getState().goBack()}
            onNext={() => void handleNextFromStep1()}
            onLogin={() => {
              useLoginStore.getState().reset();
              useNavigationStore.getState().open("login");
            }}
          />
        )}

        {step === 2 && (
          <AgeStep
            onBack={() => setStep(1)}
            onRegister={() => void handleRegister()}
          />
        )}
      </FormProvider>
    </AuthScreen>
  );
}

const styles = StyleSheet.create({
  // Tighter than the default auth card so each step fits one screen.
  card: { paddingVertical: 16, gap: 12 },
});
