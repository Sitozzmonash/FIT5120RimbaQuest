import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { FONTS } from "../../../../constants/fonts";
import { PROFILE_COLORS } from "../profileTheme";

export function LevelPill({ level }: { level: number }) {
  return (
    <View style={styles.pill}>
      <MaterialIcons name="star" size={20} color={PROFILE_COLORS.goldText} />
      <Text style={styles.text}>Level {level}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingLeft: 6,
    paddingRight: 12,
    paddingVertical: 2,
    backgroundColor: PROFILE_COLORS.goldLight,
    borderWidth: 3,
    borderBottomWidth: 6,
    borderColor: PROFILE_COLORS.ink,
    borderRadius: 999,
  },
  text: {
    fontFamily: FONTS.display,
    color: PROFILE_COLORS.goldText,
    fontSize: 15,
  },
});
