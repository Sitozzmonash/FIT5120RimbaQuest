import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { FONTS } from "../../../../constants/fonts";
import { LOCATION_COLORS } from "../locationsTheme";

export function PlacesSectionHeader({ count }: { count: number }) {
  return (
    <View style={styles.row}>
      <Text style={styles.title}>Explore spots</Text>
      <View style={styles.badge}>
        <Text style={styles.badgeText}>
          {count} {count === 1 ? "place" : "places"}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  title: { fontFamily: FONTS.display, color: LOCATION_COLORS.forest, fontSize: 20 },
  badge: {
    backgroundColor: LOCATION_COLORS.forest,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  badgeText: { color: "#FFFFFF", fontSize: 13, fontFamily: FONTS.bodyBlack },
});
