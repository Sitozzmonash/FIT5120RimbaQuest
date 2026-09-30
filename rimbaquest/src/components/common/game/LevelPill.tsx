import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { FONTS } from "../../../constants/fonts";
import { GAME_COLORS } from "./gameTheme";

export function LevelPill({ level }: { level: number }) {
  return (
    <View style={styles.pill}>
      <MaterialIcons name="star" size={20} color={GAME_COLORS.goldText} />
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
    backgroundColor: GAME_COLORS.goldLight,
    borderWidth: 3,
    borderBottomWidth: 6,
    borderColor: GAME_COLORS.ink,
    borderRadius: 999,
  },
  text: {
    fontFamily: FONTS.display,
    color: GAME_COLORS.goldText,
    fontSize: 15,
  },
});
