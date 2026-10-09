import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { FONTS } from "../../../../constants/fonts";
import { LOCATION_COLORS } from "../locationsTheme";

export function DistancePill({ label }: { label: string }) {
  return (
    <View style={styles.pill}>
      <Text style={styles.text}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: LOCATION_COLORS.distancePill,
    borderWidth: 2,
    borderColor: LOCATION_COLORS.ink,
    borderRadius: 100,
  },
  text: {
    fontFamily: FONTS.bodyExtraBold,
    fontSize: 11,
    color: LOCATION_COLORS.paper,
  },
});
