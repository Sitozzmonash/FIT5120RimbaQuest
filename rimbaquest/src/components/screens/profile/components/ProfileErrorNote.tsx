import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { FONTS } from "../../../../constants/fonts";
import { PROFILE_COLORS } from "../profileTheme";

export function ProfileErrorNote({ message }: { message: string }) {
  return (
    <View style={styles.box} accessibilityRole="alert">
      <Text style={styles.text}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    padding: 12,
    backgroundColor: "#FCE8E8",
    borderWidth: 3,
    borderColor: PROFILE_COLORS.ink,
    borderRadius: 14,
  },
  text: { fontFamily: FONTS.bodyBold, color: "#B3261E", fontSize: 13, textAlign: "center" },
});
