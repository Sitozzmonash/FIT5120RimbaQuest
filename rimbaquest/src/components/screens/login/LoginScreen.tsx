import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { AUTH_IMAGES } from "../../../constants/images";
import { API_BASE } from "../../../constants/config";
import { useForgotPasswordStore } from "../../../store/useForgotPasswordStore";
import { useLoginStore } from "../../../store/useLoginStore";
import { useNavigationStore } from "../../../store/useNavigationStore";
import { useUserStore } from "../../../store/useUserStore";
import { profileFromAuth } from "../../../utils/authApi";
import { GameButton } from "../../common/game/GameButton";
import { AuthErrorBanner } from "../auth/AuthErrorBanner";
import { AuthLink } from "../auth/AuthLink";
import { AuthScreen } from "../auth/AuthScreen";
import { AuthTextField } from "../auth/AuthTextField";
import { authBodyStyle, authTitleStyle } from "../auth/authTheme";

export function LoginScreen() {
  const username = useLoginStore((state) => state.username);
  const password = useLoginStore((state) => state.password);
  const fieldErrors = useLoginStore((state) => state.fieldErrors);
  const authError = useLoginStore((state) => state.authError);
  const submitting = useLoginStore((state) => state.submitting);

  const handleLogin = async () => {
    const store = useLoginStore.getState();
    if (store.submitting) return;
    store.setAuthError(null);
    const errors: Record<string, string> = {};
    if (!store.username.trim())
      errors.username = "Please enter your explorer name or email.";
    if (!store.password) errors.password = "Please enter your password.";
    store.setFieldErrors(errors);
    if (Object.keys(errors).length) return;

    store.setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/api/v1/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username_or_email: store.username.trim(),
          password: store.password,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (res.status >= 500)
          store.setAuthError(
            "We couldn't reach RimbaQuest right now. Please try again.",
          );
        else
          store.setAuthError(
            "That name, email, or password does not match. Try again.",
          );
        return;
      }
      const token = String(data.access_token || "");
      if (!token) throw new Error("Login did not return an access token.");
      useUserStore.getState().applyUser(profileFromAuth(data), token);
    } catch {
      store.setAuthError(
        "We couldn't reach RimbaQuest right now. Please try again.",
      );
    } finally {
      store.setSubmitting(false);
    }
  };

  return (
    <AuthScreen
      hero={AUTH_IMAGES.heroElephantTiger}
      heroWidth={200}
      heroHeight={160}
      heroOverlap={37}
    >
      <Text style={authTitleStyle}>Welcome Back!</Text>
      <AuthErrorBanner message={authError} />

      <View style={styles.fields}>
        <AuthTextField
          label="Username or Email Address *"
          icon="mail-outline"
          placeholder="Enter username or email"
          value={username}
          onChangeText={useLoginStore.getState().setUsername}
          error={fieldErrors.username}
          autoCapitalize="none"
          autoComplete="username"
        />
        <AuthTextField
          label="Password *"
          icon="lock-outline"
          password
          placeholder="Enter your password"
          value={password}
          onChangeText={useLoginStore.getState().setPassword}
          error={fieldErrors.password}
          autoComplete="current-password"
          onSubmitEditing={() => void handleLogin()}
        />
        <View style={styles.forgotRow}>
          <AuthLink
            label="Forgot Password?"
            onPress={() => {
              useForgotPasswordStore.getState().reset();
              useNavigationStore.getState().open("forgot_password");
            }}
          />
        </View>
      </View>

      <GameButton
        label="Log In"
        loading={submitting}
        onPress={() => void handleLogin()}
      />

      <View style={styles.signup}>
        <Text style={authBodyStyle}>New to RimbaQuest?</Text>
        <AuthLink
          label="Create Account"
          onPress={() => {
            useLoginStore.getState().reset();
            useNavigationStore.getState().open("create_account");
          }}
        />
      </View>
    </AuthScreen>
  );
}

const styles = StyleSheet.create({
  fields: { gap: 14 },
  forgotRow: { alignItems: "flex-end" },
  signup: { alignItems: "center", gap: 4 },
});
