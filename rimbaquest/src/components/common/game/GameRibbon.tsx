import React from "react";
import { StyleProp, StyleSheet, Text, View, ViewStyle } from "react-native";
import { FONTS } from "../../../constants/fonts";
import { GAME_COLORS } from "./gameTheme";

export function GameRibbon({
  label,
  style,
}: {
  label: string;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={[styles.ribbon, style]}>
      <View style={[styles.tail, { left: 0 }]} />
      <View style={[styles.tail, { right: 0 }]} />
      <View style={styles.center}>
        <View style={styles.shine} />
        <Text style={styles.text} numberOfLines={1}>
          {label}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  ribbon: { width: 260, height: 54, alignSelf: "center" },
  tail: {
    position: "absolute",
    top: 12,
    width: 50,
    height: 40,
    backgroundColor: "#C25E00",
    borderWidth: 3,
    borderColor: GAME_COLORS.ink,
  },
  center: {
    position: "absolute",
    top: 0,
    left: 18,
    right: 18,
    height: 46 + 4,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFB938",
    borderWidth: 3,
    borderBottomWidth: 7,
    borderColor: GAME_COLORS.ink,
    borderRadius: 10,
    overflow: "hidden",
  },
  shine: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 5,
    backgroundColor: "rgba(255, 255, 255, 0.35)",
  },
  text: {
    fontFamily: FONTS.display,
    color: "#FFFFFF",
    fontSize: 18,
    textShadowColor: "#7A3500",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 1,
  },
});
