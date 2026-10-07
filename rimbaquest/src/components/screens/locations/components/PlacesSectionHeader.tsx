import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { FONTS } from "../../../../constants/fonts";
import { useLocationsStore } from "../../../../store/useLocationsStore";
import { LOCATION_COLORS } from "../locationsTheme";

export function PlacesSectionHeader({ count }: { count: number }) {
  const distanceNotice = useLocationsStore((state) => state.distanceNotice);

  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>Explore spots</Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>
              {count} {count === 1 ? "place" : "places"}
            </Text>
          </View>
        </View>
      </View>
      {distanceNotice ? (
        <Text style={styles.notice}>{distanceNotice}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 6 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexShrink: 1,
  },
  title: {
    fontFamily: FONTS.display,
    color: LOCATION_COLORS.forest,
    fontSize: 20,
  },
  badge: {
    backgroundColor: LOCATION_COLORS.forest,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  badgeText: { color: "#FFFFFF", fontSize: 12, fontFamily: FONTS.bodyBlack },
  notice: {
    color: LOCATION_COLORS.muted,
    fontSize: 12,
    lineHeight: 16,
    fontFamily: FONTS.bodyBold,
  },
});
