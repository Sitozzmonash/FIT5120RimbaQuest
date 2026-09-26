import React, { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { FONTS } from "../../../constants/fonts";
import { AUTH_IMAGES } from "../../../constants/images";
import { API_BASE } from "../../../constants/config";
import { EMAIL_RE } from "../../../constants/validation";
import { useForgotPasswordStore } from "../../../store/useForgotPasswordStore";
import { useNavigationStore } from "../../../store/useNavigationStore";
import { apiMessage } from "../../../utils/authApi";
import { GameButton } from "../../common/game/GameButton";
import { WoodModal } from "../../common/game/WoodModal";
import { AuthErrorBanner } from "../auth/AuthErrorBanner";
import { AuthLink } from "../auth/AuthLink";
import { AuthScreen } from "../auth/AuthScreen";
import { AuthTextField } from "../auth/AuthTextField";
import { AUTH_COLORS, authBodyStyle, authTitleStyle } from "../auth/authTheme";
import { RecoveryEmailField } from "./components/RecoveryEmailField";

export function ResetPasswordScreen() {
  const email = useForgotPasswordStore((state) => state.email);
  const token = useForgotPasswordStore((state) => state.token);
  const newPassword = useForgotPasswordStore((state) => state.newPassword);
  const confirmPassword = useForgotPasswordStore(
    (state) => state.confirmPassword,
  );
  const fieldError = useForgotPasswordStore((state) => state.fieldError);
  const formError = useForgotPasswordStore((state) => state.formError);
  const submitting = useForgotPasswordStore((state) => state.submitting);

  const [showEmailInput] = useState(() => !email.trim());
  const [resetDone, setResetDone] = useState(false);

  // After the "All done!" popup: clear the form and go to Log In.
  const finishReset = () => {
    const store = useForgotPasswordStore.getState();
    store.setToken("");
    store.setNewPassword("");
    store.setConfirmPassword("");
    setResetDone(false);
    useNavigationStore.getState().resetTo("login");
  };

  const handleResetPassword = async () => {
    const store = useForgotPasswordStore.getState();
    if (store.submitting) return;
    store.setFieldError(null);
    const recoveryToken = store.token.replace(/\s/g, "").toUpperCase();
    if (!EMAIL_RE.test(store.email.trim())) {
      store.setFormError("Please enter the email used for your account.");
      return;
    }
    if (recoveryToken.length !== 6) {
      store.setFormError(
        "Please type all 6 letters or numbers from the email.",
      );
      return;
    }
    if (!store.newPassword) {
      store.setFormError("Please create a password.");
      return;
    }
    if (store.newPassword.length < 6) {
      store.setFormError(
        "Use at least 6 letters, numbers, or symbols for your password.",
      );
      return;
    }
    if (store.newPassword !== store.confirmPassword) {
      store.setFieldError("Passwords do not match.");
      return;
    }
    store.setSubmitting(true);
    store.setFormError(null);
    try {
      const res = await fetch(`${API_BASE}/api/v1/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: store.email.trim(),
          recovery_token: recoveryToken,
          new_password: store.newPassword,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const apiError = apiMessage(
          data,
          "That verification code is wrong or too old.",
        );
        const message = /invalid|expired|recovery|token/i.test(apiError)
          ? "That verification code is wrong or too old."
          : apiError;
        store.setFormError(
          /expired/i.test(message)
            ? `${message} Please ask for a new code.`
            : message,
        );
        return;
      }
      setResetDone(true);
    } catch {
      store.setFormError(
        "We couldn't reach RimbaQuest right now. Please try again.",
      );
    } finally {
      store.setSubmitting(false);
    }
  };

  const { setToken, setNewPassword, setConfirmPassword } =
    useForgotPasswordStore.getState();

  return (
    <AuthScreen
      hero={AUTH_IMAGES.heroTigerSunBear}
      heroWidth={280}
      heroHeight={210}
      heroOverlap={43}
    >
      <Text style={authTitleStyle}>Reset Password</Text>
      <Text style={authBodyStyle}>
        {showEmailInput ? (
          "Enter the code from your email, then create a new password for your account."
        ) : (
          <>
            Enter the code we sent to{" "}
            <Text style={styles.email}>{email.trim()}</Text>, then create a new
            password for your account.
          </>
        )}
      </Text>
      <AuthErrorBanner message={formError} />

      <View style={styles.fields}>
        {showEmailInput && <RecoveryEmailField showError={false} />}
        <AuthTextField
          label="Verification Code *"
          icon="vpn-key"
          placeholder="Type all 6 letters or numbers"
          value={token}
          onChangeText={(val) => setToken(val.replace(/\s/g, "").toUpperCase())}
          autoCapitalize="characters"
          autoComplete="one-time-code"
          maxLength={50}
        />
        <AuthTextField
          label="New Password *"
          icon="lock-outline"
          password
          placeholder="Enter new password"
          value={newPassword}
          onChangeText={setNewPassword}
          error={Boolean(fieldError)}
          autoComplete="new-password"
        />
        <AuthTextField
          label="Confirm New Password *"
          icon="lock-outline"
          password
          placeholder="Re-enter new password"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          error={fieldError}
          autoComplete="new-password"
          onSubmitEditing={() => void handleResetPassword()}
        />
      </View>

      <GameButton
        label="Reset Password"
        loading={submitting}
        onPress={() => void handleResetPassword()}
      />

      <AuthLink
        label="Back to Log In"
        onPress={() => useNavigationStore.getState().resetTo("login")}
      />

      <WoodModal
        visible={resetDone}
        onRequestClose={finishReset}
        icon="check"
        positive
        title="All done!"
        message="Your new password is ready. Log in with it now."
        actionLabel="Go to Log In"
        onAction={finishReset}
      />
    </AuthScreen>
  );
}

const styles = StyleSheet.create({
  fields: { gap: 14 },
  email: { fontFamily: FONTS.bodyBlack, color: AUTH_COLORS.title },
});
