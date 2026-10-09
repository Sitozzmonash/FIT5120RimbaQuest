import React from "react";
import { StyleSheet, View, ViewStyle } from "react-native";
import { HOME_COLORS } from "../homeTheme";

type PlankLine = [start: number, end: number];

// Two plank horizontal lines
const DEFAULT_LINES: PlankLine[] = [
  [28.571, 35.714],
  [64.286, 71.429],
];

export function WoodenSign({
  children,
  lines = DEFAULT_LINES,
  shadowOffset = 3,
  style,
}: {
  children: React.ReactNode;
  // Plank lines as [start%, end%] of the sign's inner height.
  lines?: PlankLine[];
  shadowOffset?: number;
  style?: ViewStyle | ViewStyle[];
}) {
  return (
    <View style={[styles.sign, { borderBottomWidth: 3 + shadowOffset }, style]}>
      {lines.map(([start, end]) => (
        <View
          key={start}
          style={[styles.seam, { top: `${start}%`, height: `${end - start}%` }]}
        />
      ))}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  sign: {
    alignItems: "center",
    backgroundColor: HOME_COLORS.wood,
    borderColor: HOME_COLORS.ink,
    borderWidth: 3,
    borderRadius: 10,
    overflow: "hidden",
  },
  seam: {
    position: "absolute",
    left: 0,
    right: 0,
    backgroundColor: HOME_COLORS.woodLine,
  },
});
