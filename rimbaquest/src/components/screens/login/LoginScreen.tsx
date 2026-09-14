import React from "react";
import { Image, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { AUTH_IMAGES } from "../../../constants/images";
import { API_BASE } from "../../../constants/config";
import { useForgotPasswordStore } from "../../../store/useForgotPasswordStore";
import { useLoginStore } from "../../../store/useLoginStore";
import { useNavigationStore } from "../../../store/useNavigationStore";
import { useUserStore } from "../../../store/useUserStore";
import { apiMessage, profileFromAuth } from "../../../utils/authApi";
import { PasswordField } from "./components/PasswordField";
import { UsernameField } from "./components/UsernameField";
import { Tap } from "../../common/Tap";
import { PrimaryButton } from "../../common/PrimaryButton";

export function LoginScreen() {
  const authError = useLoginStore((state) => state.authError);
  const submitting = useLoginStore((state) => state.submitting);
  const insets = useSafeAreaInsets();

  const handleLogin = async () => {
    const store = useLoginStore.getState();
    if (store.submitting) return;
    store.setAuthError(null);
    const errors: Record<string, string> = {};
    if (!store.username.trim())
      errors.username = "Please enter your username or email.";
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
            apiMessage(data, "Invalid username or password. Please try again."),
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
    <View style={styles.loginRoot}>
      <LinearGradient
        colors={["#C8F0D8", "#E0F5E9", "#F0FAF4", "#E8F6EE"]}
        locations={[0, 0.3, 0.6, 1]}
        style={styles.loginBackground}
      />
      <View style={[styles.loginDecoCircle1, { pointerEvents: "none" }]} />
      <View style={[styles.loginDecoCircle2, { pointerEvents: "none" }]} />

      <ScrollView
        contentContainerStyle={[
          styles.loginScroll,
          { paddingTop: insets.top, paddingBottom: 40 + insets.bottom },
        ]}
      >
        <View style={styles.loginCenterWrap}>
          <View style={styles.loginContent}>
            <View style={styles.loginMascotBlob}>
              <Image
                source={AUTH_IMAGES.mascotLogin}
                style={styles.loginMascotImage}
                resizeMode="cover"
              />
            </View>

            <Text style={styles.loginTitle}>Welcome Back!</Text>

            {authError && (
              <Text style={styles.loginErrorBanner}>{authError}</Text>
            )}

            <View style={styles.loginFields}>
              <UsernameField />
              <PasswordField />

              <View style={styles.loginForgotRow}>
                <Tap
                  label="Forgot Password"
                  style={{}}
                  onPress={() => {
                    useForgotPasswordStore.getState().reset();
                    useNavigationStore.getState().open("forgot_password");
                  }}
                >
                  <Text style={styles.loginForgotText}>Forgot Password?</Text>
                </Tap>
              </View>
            </View>

            <View style={styles.loginActions}>
              <PrimaryButton
                label="Log In"
                displayText={submitting ? "Logging in..." : "Log In"}
                loading={submitting}
                style={styles.loginSubmitBtn}
                onPress={() => void handleLogin()}
              />

              <View style={styles.loginSignupRow}>
                <Text style={styles.loginSignupText}>New to RimbaQuest?</Text>
                <Tap
                  label="Create Account"
                  style={{}}
                  onPress={() => {
                    useLoginStore.getState().reset();
                    useNavigationStore.getState().open("create_account");
                  }}
                >
                  <Text style={styles.loginSignupLink}>Create Account</Text>
                </Tap>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  loginRoot: { flex: 1 },
  loginBackground: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  loginDecoCircle1: {
    position: "absolute",
    left: -60,
    top: -60,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: "#78B833",
    opacity: 0.15,
  },
  loginDecoCircle2: {
    position: "absolute",
    left: "77%",
    top: "82%",
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: "#78B833",
    opacity: 0.12,
  },
  loginScroll: { flexGrow: 1, paddingHorizontal: 24, paddingBottom: 40 },
  loginCenterWrap: { flex: 1, justifyContent: "center" },
  loginContent: { alignItems: "center", gap: 24, paddingVertical: 16 },
  loginMascotBlob: {
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: "rgba(216,240,224,0.4)",
    alignItems: "center",
    justifyContent: "center",
  },
  loginMascotImage: { width: 176, height: 180 },
  loginTitle: {
    color: "#0A4D26",
    fontSize: 24,
    lineHeight: 29,
    fontWeight: "900",
    textAlign: "center",
  },
  loginFields: { gap: 14, width: "100%" },
  loginForgotRow: { alignItems: "flex-end", width: "100%" },
  loginForgotText: { color: "#2EB85C", fontSize: 14, fontWeight: "700" },
  loginActions: { gap: 16, alignItems: "center", width: "100%" },
  loginSubmitBtn: { width: "100%" },
  loginSignupRow: { alignItems: "center", gap: 4 },
  loginSignupText: { color: "#637D6E", fontSize: 14 },
  loginSignupLink: { color: "#0A4D26", fontSize: 14, fontWeight: "700" },
  loginErrorBanner: {
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
