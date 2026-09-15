import React from "react";
import { Image, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { AUTH_IMAGES } from "../../../constants/images";
import { API_BASE } from "../../../constants/config";
import { EMAIL_RE } from "../../../constants/validation";
import { useForgotPasswordStore } from "../../../store/useForgotPasswordStore";
import { useNavigationStore } from "../../../store/useNavigationStore";
import { apiMessage } from "../../../utils/authApi";
import { RecoveryEmailField } from "./components/RecoveryEmailField";
import { Tap } from "../../common/Tap";
import { PrimaryButton } from "../../common/PrimaryButton";

export function ForgotPasswordScreen() {
  const insets = useSafeAreaInsets();

  const formError = useForgotPasswordStore((state) => state.formError);
  const submitting = useForgotPasswordStore((state) => state.submitting);

  const handleSendRecoveryLink = async () => {
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
      const data = (await res.json().catch(() => ({}))) as {
        dev_code?: string;
        simulated_token?: string;
        [key: string]: unknown;
      };
      if (!res.ok) {
        store.setFieldError(
          apiMessage(data, "We could not find an account with that email."),
        );
        return;
      }
      const token = data.dev_code || data.simulated_token || "";
      store.setToken(token);
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
    <View style={styles.forgotRoot}>
      <LinearGradient
        colors={["#C8F0D8", "#E0F5E9", "#F0FAF4", "#E8F6EE"]}
        locations={[0, 0.3, 0.6, 1]}
        style={styles.forgotBackground}
      />
      <View style={[styles.forgotDecoCircle1, { pointerEvents: "none" }]} />
      <View style={[styles.forgotDecoCircle2, { pointerEvents: "none" }]} />

      <ScrollView
        contentContainerStyle={[
          styles.forgotScroll,
          { paddingTop: insets.top, paddingBottom: 40 + insets.bottom },
        ]}
      >
        <View style={styles.forgotCenterWrap}>
          <View style={styles.forgotContent}>
            <View style={styles.forgotMascotBlob}>
              <Image
                source={AUTH_IMAGES.mascotForgot}
                style={styles.forgotMascotImage}
                resizeMode="cover"
              />
            </View>

            <View style={styles.forgotTextGroup}>
              <Text style={styles.forgotTitle}>Need a New Password?</Text>
              <Text style={styles.forgotSubtitle}>
                Enter the email used for your account. We will send a secret code
                to that email.
              </Text>
            </View>

            {formError && (
              <Text style={styles.forgotErrorBanner}>{formError}</Text>
            )}

            <View style={styles.forgotActionGroup}>
              <RecoveryEmailField />

              <PrimaryButton
                label="Send Secret Code"
                displayText={submitting ? "Sending..." : "Send Secret Code"}
                loading={submitting}
                style={styles.forgotSubmitBtn}
                onPress={() => void handleSendRecoveryLink()}
              />
            </View>

            <Tap
              label="Back to Log In"
              style={{}}
              onPress={() => useNavigationStore.getState().resetTo("login")}
            >
              <Text style={styles.forgotBackToLogin}>Back to Log In</Text>
            </Tap>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  forgotRoot: { flex: 1 },
  forgotBackground: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  forgotDecoCircle1: {
    position: "absolute",
    left: -60,
    top: -60,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: "#78B833",
    opacity: 0.15,
  },
  forgotDecoCircle2: {
    position: "absolute",
    left: "75%",
    top: "75%",
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: "#78B833",
    opacity: 0.12,
  },
  forgotScroll: { flexGrow: 1, paddingHorizontal: 24, paddingBottom: 40 },
  forgotCenterWrap: { flex: 1, justifyContent: "center" },
  forgotContent: { alignItems: "center", gap: 24, paddingVertical: 16 },
  forgotMascotBlob: {
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: "rgba(216,240,224,0.5)",
    alignItems: "center",
    justifyContent: "center",
  },
  forgotMascotImage: { width: 166, height: 180 },
  forgotTextGroup: { gap: 10, alignItems: "center" },
  forgotTitle: {
    color: "#0A4D26",
    fontSize: 24,
    lineHeight: 29,
    fontWeight: "900",
    textAlign: "center",
  },
  forgotSubtitle: {
    color: "#2D5A3E",
    fontSize: 15,
    lineHeight: 22.5,
    textAlign: "center",
  },
  forgotActionGroup: { gap: 16, width: "100%" },
  forgotSubmitBtn: { width: "100%" },
  forgotBackToLogin: { color: "#0A4D26", fontSize: 14, fontWeight: "700" },
  forgotErrorBanner: {
    color: "#D9383A",
    backgroundColor: "#FCE8E8",
    borderRadius: 10,
    padding: 10,
    fontSize: 12,
    fontWeight: "700",
    width: "100%",
    textAlign: "center",
  },
});
