import React from "react";
import { StyleProp, StyleSheet, View, ViewStyle } from "react-native";
import { GAME_COLORS } from "./gameTheme";
import { WoodPlank } from "./WoodPlank";

// Cream card topped with a centered wooden plank title.
export function WoodCard({
  title,
  children,
  bodyStyle,
}: {
  title: string;
  children: React.ReactNode;
  bodyStyle?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={styles.card}>
      <WoodPlank title={title} centered />
      <View style={[styles.body, bodyStyle]}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: GAME_COLORS.paper,
    borderWidth: 3,
    borderBottomWidth: 8,
    borderColor: GAME_COLORS.ink,
    borderRadius: 20,
    overflow: "hidden",
  },
  body: { gap: 12, paddingTop: 14, paddingBottom: 16, paddingHorizontal: 16 },
});
