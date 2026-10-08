// "YOU" / "BOT" / "FRIEND" pill on the arena cards and status panels.
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { FONTS } from "../../../../constants/fonts";
import { GAME_COLORS } from "../../../common/game/gameTheme";

const INK = GAME_COLORS.ink;

export function Tag({
  label,
  color,
  light = false,
}: {
  label: string;
  color: string;
  light?: boolean;
}) {
  return (
    <View
      style={[
        styles.tag,
        { backgroundColor: color, borderColor: light ? "#FFFFFF" : INK },
      ]}
    >
      <Text style={styles.tagText}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  tag: {
    borderWidth: 2,
    borderRadius: 999,
    paddingHorizontal: 7,
    paddingVertical: 1,
  },
  tagText: {
    fontFamily: FONTS.bodyBlack,
    fontSize: 9.5,
    letterSpacing: 1,
    color: "#FFFFFF",
  },
});
