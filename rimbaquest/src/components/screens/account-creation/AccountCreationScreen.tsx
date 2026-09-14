import React, { useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
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
          "Registration was unsuccessful. Please try again.",
        );

        message = message.replace(
          /^String should have at least (\d+) characters?$/i,
          "Password should have at least $1 characters",
        );

        if (/already taken/i.test(message)) {
          form.setError("username", {
            type: "server",
            message: "That username is already taken. Try another one.",
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
      setAuthError("Registration was unsuccessful. Please try again.");
    }
  });

  const insets = useSafeAreaInsets();

  return (
    <View style={styles.createRoot}>
      <LinearGradient
        colors={["#C8F0D8", "#E0F5E9", "#F0FAF4", "#E8F6EE"]}
        locations={[0, 0.3, 0.6, 1]}
        style={styles.createBackground}
      />

      <View style={[styles.createDecoCircle1, { pointerEvents: "none" }]} />
      <View style={[styles.createDecoCircle2, { pointerEvents: "none" }]} />
      <View style={[styles.createDecoCircle3, { pointerEvents: "none" }]} />
      <View style={[styles.createDecoCircle4, { pointerEvents: "none" }]} />

      <ScrollView
        contentContainerStyle={[
          styles.createScroll,
          {
            paddingTop: 16 + insets.top,
            paddingBottom: 24 + insets.bottom,
            flexGrow: 1,
          },
        ]}
      >
        <View style={styles.createBrandIntro}>
          <Text style={styles.createTitle}>Create Your Explorer Account</Text>
        </View>

        <View style={styles.createCenterWrap}>
          {authError && (
            <Text style={styles.createErrorBanner}>{authError}</Text>
          )}

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
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  createRoot: { flex: 1 },
  createBackground: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  createDecoCircle1: {
    position: "absolute",
    left: -30,
    top: -30,
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: "#78B833",
    opacity: 0.15,
  },
  createDecoCircle2: {
    position: "absolute",
    left: "75%",
    top: 40,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#78B833",
    opacity: 0.1,
  },
  createDecoCircle3: {
    position: "absolute",
    left: -20,
    top: "87%",
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#FFC314",
    opacity: 0.08,
  },
  createDecoCircle4: {
    position: "absolute",
    left: "80%",
    top: "63%",
    width: 90,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#78B833",
    opacity: 0.07,
  },
  createScroll: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 24,
    gap: 16,
  },
  createBrandIntro: { alignItems: "center", gap: 4, paddingVertical: 6 },
  createBrandLogo: { width: 176, height: 40 },
  createTitle: {
    color: "#0A4D26",
    fontSize: 24,
    lineHeight: 29,
    fontWeight: "900",
    textAlign: "center",
  },
  createErrorBanner: {
    color: "#D9383A",
    backgroundColor: "#FCE8E8",
    borderRadius: 10,
    padding: 10,
    fontSize: 12,
    fontWeight: "700",
    textAlign: "center",
  },
  createCenterWrap: { flex: 1, justifyContent: "flex-start" },
});
