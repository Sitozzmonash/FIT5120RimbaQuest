import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { GAME_COLORS, outlinedTitleStyle } from "./gameTheme";

// Grain lines every 10px, enough to cover a three-line title.
const STRIPE_TOPS = [8, 18, 28, 38, 48, 58, 68, 78, 88];

// Riveted wooden plank carrying a title, used as a card header.
export function WoodPlank({
  title,
  centered = false,
  large = false,
  compact = false,
  accessory,
}: {
  title: string;
  // Centered single-line title on a 43px plank (section cards).
  centered?: boolean;
  // Bigger 24px title, e.g. an animal's name.
  large?: boolean;
  // Slim 16px centered bar without rivets, e.g. the battle move tray.
  compact?: boolean;
  // Shown beside the title, e.g. a category badge.
  accessory?: React.ReactNode;
}) {
  const titleText = (
    <Text
      style={[
        styles.title,
        (centered || compact) && styles.titleCentered,
        large && styles.titleLarge,
        compact && styles.titleCompact,
      ]}
    >
      {title}
    </Text>
  );

  return (
    <View
      style={[
        styles.plank,
        centered && styles.plankCentered,
        large && styles.plankLarge,
        compact && styles.plankCompact,
      ]}
    >
      {/* wood stripes */}
      {STRIPE_TOPS.map((top) => (
        <View key={top} style={[styles.stripe, { top }]} />
      ))}
      <View style={styles.highlight} />

      {/* rivets are the wood holes */}
      {compact ? null : (
        <>
          <View style={[styles.rivet, { left: 11 }]} />
          <View style={[styles.rivet, { right: 11 }]} />
        </>
      )}

      {accessory ? (
        <View style={styles.titleRow}>
          {titleText}
          {accessory}
        </View>
      ) : (
        titleText
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  plank: {
    paddingHorizontal: 30,
    paddingVertical: 9,
    backgroundColor: GAME_COLORS.wood,
    borderBottomWidth: 3,
    borderBottomColor: GAME_COLORS.ink,
    overflow: "hidden",
  },
  plankCentered: {
    minHeight: 43,
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  plankLarge: { paddingVertical: 12 },
  plankCompact: { paddingTop: 6, paddingBottom: 9, alignItems: "center" },
  titleRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  stripe: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: GAME_COLORS.woodLine,
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
    backgroundColor: GAME_COLORS.rivet,
  },
  title: {
    ...outlinedTitleStyle,
    textShadowColor: GAME_COLORS.woodTextShadow,
    fontSize: 18,
    lineHeight: 20.7,
  },
  titleCentered: { textAlign: "center" },
  titleLarge: { fontSize: 24, lineHeight: 29 },
  titleCompact: { fontSize: 16, lineHeight: 19 },
});
