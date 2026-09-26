import React from "react";
import { StyleSheet, View } from "react-native";
import { GAME_COLORS } from "./gameTheme";

export function DashedDivider() {
  return (
    <View style={styles.clip}>
      <View style={styles.dashes} />
    </View>
  );
}

const styles = StyleSheet.create({
  clip: { height: 2, overflow: "hidden" },
  dashes: {
    height: 6,
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: GAME_COLORS.divider,
  },
});
