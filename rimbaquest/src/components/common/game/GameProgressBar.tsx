import React from "react";
import { StyleSheet, View } from "react-native";
import { GAME_COLORS } from "./gameTheme";

// Thick outlined progress track; `percent` is 0-100.
export function GameProgressBar({
  percent,
  height = 20,
}: {
  percent: number;
  height?: number;
}) {
  const clamped = Math.max(0, Math.min(100, percent));

  return (
    <View
      style={[styles.track, { height }]}
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: clamped }}
    >
      {clamped > 0 && <View style={[styles.fill, { width: `${clamped}%` }]} />}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    width: "100%",
    backgroundColor: GAME_COLORS.track,
    borderWidth: 3,
    borderColor: GAME_COLORS.ink,
    borderRadius: 999,
    overflow: "hidden",
  },
  fill: { height: "100%", borderRadius: 999, backgroundColor: GAME_COLORS.go },
});
