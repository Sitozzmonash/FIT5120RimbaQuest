import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { FONTS } from "../../../../constants/fonts";
import { PROFILE_COLORS } from "../profileTheme";

export function CollectionSummary({
  found,
  total,
  percent,
}: {
  found: number;
  total: number;
  percent: number;
}) {
  return (
    <View style={styles.row}>
      <Text style={styles.count} numberOfLines={1}>
        <Text style={styles.big}>{found}</Text>
        <Text style={[styles.big, styles.faded]}> / {total} </Text>
        <Text style={styles.found}>Found</Text>
      </Text>
      <View style={styles.percentPill}>
        <Text style={styles.percentText}>{percent}%</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  count: {
    flexShrink: 1,
    fontFamily: FONTS.display,
    color: PROFILE_COLORS.heading,
  },
  big: { fontSize: 28 },
  faded: { color: PROFILE_COLORS.faded },
  found: { fontSize: 18 },
  percentPill: {
    paddingHorizontal: 12,
    paddingVertical: 2,
    backgroundColor: PROFILE_COLORS.avatarBg,
    borderWidth: 2,
    borderColor: PROFILE_COLORS.pillBorder,
    borderRadius: 999,
  },
  percentText: {
    fontFamily: FONTS.display,
    color: PROFILE_COLORS.pillText,
    fontSize: 16,
  },
});
