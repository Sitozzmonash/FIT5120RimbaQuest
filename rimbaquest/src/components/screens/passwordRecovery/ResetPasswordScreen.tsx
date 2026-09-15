import React from "react";
import { Alert, Image, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { AUTH_IMAGES } from "../../../constants/images";
import { API_BASE } from "../../../constants/config";
import { useForgotPasswordStore } from "../../../store/useForgotPasswordStore";
import { useNavigationStore } from "../../../store/useNavigationStore";
import { apiMessage } from "../../../utils/authApi";
import { ConfirmNewPasswordField } from "./components/ConfirmNewPasswordField";
import { NewPasswordField } from "./components/NewPasswordField";
import { VerificationCodeField } from "./components/VerificationCodeField";
import { Tap } from "../../common/Tap";
import { PrimaryButton } from "../../common/PrimaryButton";

export function ResetPasswordScreen() {
  const insets = useSafeAreaInsets();

  const formError = useForgotPasswordStore((state) => state.formError);
  const submitting = useForgotPasswordStore((state) => state.submitting);

  const handleResetPassword = async () => {
    const store = useForgotPasswordStore.getState();
    if (store.submitting) return;
    store.setFieldError(null);
    if (store.token.trim().length !== 6) {
      store.setFormError("Please type all 6 letters or numbers from the email.");
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
          recovery_token: store.token.trim().toUpperCase(),
          new_password: store.newPassword,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const apiError = apiMessage(
          data,
          "That secret code is wrong or too old.",
        );
        const message = /invalid|expired|recovery|token/i.test(apiError)
          ? "That secret code is wrong or too old."
          : apiError;
        store.setFormError(
          /expired/i.test(message)
            ? `${message} Please ask for a new code.`
            : message,
        );
        return;
      }
      Alert.alert("All done!", "Your new password is ready.");
      store.setToken("");
      store.setNewPassword("");
      store.setConfirmPassword("");
      useNavigationStore.getState().resetTo("login");
    } catch {
      store.setFormError(
        "We couldn't reach RimbaQuest right now. Please try again.",
      );
    } finally {
      store.setSubmitting(false);
    }
  };

  return (
    <View style={styles.resetRoot}>
      <LinearGradient
        colors={["#C8F0D8", "#E0F5E9", "#F0FAF4", "#E8F6EE"]}
        locations={[0, 0.3, 0.6, 1]}
        style={styles.resetBackground}
      />
      <View style={[styles.resetDecoCircle1, { pointerEvents: "none" }]} />
      <View style={[styles.resetDecoCircle2, { pointerEvents: "none" }]} />

      <ScrollView
        contentContainerStyle={[styles.resetScroll, { paddingTop: insets.top }]}
      >
        <View style={styles.resetCenterWrap}>
          <View style={styles.resetMascotContainer}>
            <View style={styles.resetMascotBlob}>
              <Image
                source={AUTH_IMAGES.mascotReset}
                style={styles.resetMascotImage}
                resizeMode="cover"
              />
            </View>
          </View>

          <View
            style={[styles.resetForm, { paddingBottom: 48 + insets.bottom }]}
          >
            <View style={styles.resetTextGroup}>
              <Text style={styles.resetTitle}>Make a New Password</Text>
              <Text style={styles.resetSubtitle}>
                Type the secret code from the email, then choose a new password.
              </Text>
            </View>

            {formError && (
              <Text style={styles.resetErrorBanner}>{formError}</Text>
            )}

            <View style={styles.resetFields}>
              <View style={styles.resetField}>
                <Text style={styles.resetFieldLabel}>Secret Code *</Text>
                <VerificationCodeField />
              </View>

              <View style={styles.resetField}>
                <Text style={styles.resetFieldLabel}>New Password *</Text>
                <NewPasswordField />
              </View>

              <View style={styles.resetField}>
                <Text style={styles.resetFieldLabel}>
                  Type New Password Again *
                </Text>
                <ConfirmNewPasswordField />
              </View>
            </View>

            <View style={styles.resetActions}>
              <PrimaryButton
                label="Save New Password"
                displayText={submitting ? "Saving..." : "Save New Password"}
                loading={submitting}
                style={styles.resetSubmitBtn}
                onPress={() => void handleResetPassword()}
              />
              <Tap
                label="Back to Log In"
                style={{}}
                onPress={() => useNavigationStore.getState().resetTo("login")}
              >
                <Text style={styles.resetLinkBack}>Back to Log In</Text>
              </Tap>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  resetRoot: { flex: 1 },
  resetBackground: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  resetDecoCircle1: {
    position: "absolute",
    left: -50,
    top: -50,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: "#78B833",
    opacity: 0.15,
  },
  resetDecoCircle2: {
    position: "absolute",
    left: "70%",
    top: "80%",
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: "#78B833",
    opacity: 0.12,
  },
  resetScroll: { flexGrow: 1 },
  resetCenterWrap: { flex: 1, justifyContent: "center" },
  resetMascotContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 16,
    paddingBottom: 8,
  },
  resetMascotBlob: {
    width: 282,
    height: 255,
    borderRadius: 80,
    backgroundColor: "rgba(216,240,224,0.4)",
    alignItems: "center",
    justifyContent: "center",
  },
  resetMascotImage: { width: 250, height: 258 },
  resetForm: { gap: 28, paddingHorizontal: 24, paddingBottom: 48 },
  resetTextGroup: { gap: 8 },
  resetTitle: { color: "#0A4D26", fontSize: 24, fontWeight: "800" },
  resetSubtitle: { color: "#2D5A3E", fontSize: 15 },
  resetErrorBanner: {
    color: "#D9383A",
    backgroundColor: "#FCE8E8",
    borderRadius: 10,
    padding: 10,
    fontSize: 12,
    fontWeight: "700",
    textAlign: "center",
  },
  resetFields: { gap: 16 },
  resetField: { gap: 6 },
  resetFieldLabel: { color: "#0A4D26", fontSize: 13, fontWeight: "700" },
  resetActions: { gap: 16, alignItems: "center" },
  resetSubmitBtn: { width: "100%" },
  resetLinkBack: {
    color: "#0A4D26",
    fontSize: 15,
    fontWeight: "700",
    textDecorationLine: "underline",
  },
});
