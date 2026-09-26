import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { LOCATION_COLORS, outlinedTitleStyle } from "../locationsTheme";

// Grain lines every 10px, enough to cover a three-line title.
const STRIPE_TOPS = [8, 18, 28, 38, 48, 58, 68, 78, 88];

// Riveted wooden plank carrying a place's name.
export function PlankHeader({ title }: { title: string }) {
  return (
    <View style={styles.plank}>
      {/* wood stripes */}
      {STRIPE_TOPS.map((top) => (
        <View key={top} style={[styles.stripe, { top }]} />
      ))}
      <View style={styles.highlight} />

      {/* rivets are the wood holes */}
      <View style={[styles.rivet, { left: 11 }]} />
      <View style={[styles.rivet, { right: 11 }]} />

      <Text style={styles.title}>{title}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  plank: {
    paddingHorizontal: 30,
    paddingVertical: 9,
    backgroundColor: LOCATION_COLORS.wood,
    borderBottomWidth: 3,
    borderBottomColor: LOCATION_COLORS.ink,
    overflow: "hidden",
  },
  stripe: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: LOCATION_COLORS.woodLine,
  },
  highlight: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 4,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
  },
  rivet: {
    position: "absolute",
    top: "50%",
    marginTop: -3,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: LOCATION_COLORS.rivet,
  },
  title: {
    ...outlinedTitleStyle,
    textShadowColor: "#3B1E06",
    fontSize: 18,
    lineHeight: 20.7,
  },
});
