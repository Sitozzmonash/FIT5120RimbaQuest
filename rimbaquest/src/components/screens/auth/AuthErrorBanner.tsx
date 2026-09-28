import React from "react";
import { StyleSheet, Text } from "react-native";
import { FONTS } from "../../../constants/fonts";
import { AUTH_COLORS } from "./authTheme";

// Form-level error message shown inside the card.
export function AuthErrorBanner({ message }: { message: string | null }) {
  if (!message) return null;
  return <Text style={styles.banner}>{message}</Text>;
}

const styles = StyleSheet.create({
  banner: {
    fontFamily: FONTS.bodyBold,
    color: AUTH_COLORS.error,
    backgroundColor: "#FCE8E8",
    borderWidth: 2,
    borderColor: "rgba(217, 56, 58, 0.35)",
    borderRadius: 12,
    padding: 10,
    fontSize: 13,
    textAlign: "center",
  },
});
