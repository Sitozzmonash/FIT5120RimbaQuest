import React from "react";
import { StyleProp, StyleSheet, View, ViewStyle } from "react-native";
import { DETAIL_COLORS } from "./detailTheme";

export function DetailCard({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  return <View style={[styles.card, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    gap: 12,
    paddingTop: 18,
    paddingBottom: 24,
    paddingHorizontal: 16,
    backgroundColor: DETAIL_COLORS.paper,
    borderWidth: 3,
    borderBottomWidth: 8,
    borderColor: DETAIL_COLORS.ink,
    borderRadius: 22,
  },
});
