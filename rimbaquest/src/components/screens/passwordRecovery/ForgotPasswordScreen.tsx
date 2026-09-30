import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { AUTH_IMAGES } from "../../../constants/images";
import { API_BASE } from "../../../constants/config";
import { EMAIL_RE } from "../../../constants/validation";
import { useForgotPasswordStore } from "../../../store/useForgotPasswordStore";
import { useNavigationStore } from "../../../store/useNavigationStore";
import { apiMessage } from "../../../utils/authApi";
import { GameButton } from "../../common/game/GameButton";
import { AuthErrorBanner } from "../auth/AuthErrorBanner";
import { AuthLink } from "../auth/AuthLink";
import { AuthScreen } from "../auth/AuthScreen";
import { authBodyStyle, authTitleStyle } from "../auth/authTheme";
import { RecoveryEmailField } from "./components/RecoveryEmailField";

export function ForgotPasswordScreen() {
  const formError = useForgotPasswordStore((state) => state.formError);
  const submitting = useForgotPasswordStore((state) => state.submitting);

  const handleSendRecoveryCode = async () => {
    const store = useForgotPasswordStore.getState();
    if (store.submitting) return;
    store.setFormError(null);
    if (!store.email.trim()) {
      store.setFieldError("Please enter an email.");
      return;
    }
    if (!EMAIL_RE.test(store.email.trim())) {
      store.setFieldError("That email does not look right. Please check it.");
      return;
    }
    store.setFieldError(null);
    store.setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/api/v1/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: store.email.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        store.setFieldError(
          apiMessage(data, "We could not find an account with that email."),
        );
        return;
      }
      store.setToken("");
      useNavigationStore.getState().open("reset_password");
    } catch {
      store.setFormError(
        "We couldn't reach RimbaQuest right now. Please try again.",
      );
    } finally {
      store.setSubmitting(false);
    }
  };

  return (
    <AuthScreen
      hero={AUTH_IMAGES.heroTigerTapir}
      heroWidth={280}
      heroHeight={190}
      heroOverlap={51}
    >
      <Text style={authTitleStyle}>Forgot Password?</Text>
      <Text style={authBodyStyle}>
        Enter the email connected to your RimbaQuest account. We'll send you a
        verification code to reset your password.
      </Text>
      <AuthErrorBanner message={formError} />

      <View style={styles.actions}>
        <RecoveryEmailField
          onSubmitEditing={() => void handleSendRecoveryCode()}
        />
        <GameButton
          label="Send Recovery Code"
          loading={submitting}
          onPress={() => void handleSendRecoveryCode()}
        />
      </View>

      <AuthLink
        label="Back to Log In"
        onPress={() => useNavigationStore.getState().resetTo("login")}
      />
    </AuthScreen>
  );
}

const styles = StyleSheet.create({
  actions: { gap: 14 },
});
