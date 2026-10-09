import React from "react";
import { Image, StyleSheet, Text, View } from "react-native";
import { FONTS } from "../../../../constants/fonts";
import { LOCATION_COLORS } from "../locationsTheme";

const CLOCK_ICON = require("../../../../../assets/locations/clock.png");

export function InfoPill({
  label,
  withClock = false,
}: {
  label: string;
  withClock?: boolean;
}) {
  return (
    <View style={styles.pill}>
      {/* {withClock && (
        <Image source={CLOCK_ICON} style={styles.clock} resizeMode="contain" />
      )} */}
      <Text style={styles.text}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    backgroundColor: LOCATION_COLORS.pillBg,
    borderWidth: 2,
    borderColor: LOCATION_COLORS.pillBorder,
    borderRadius: 999,
  },
  clock: { width: 13, height: 14.7 },
  text: {
    color: LOCATION_COLORS.pillText,
    fontSize: 12,
    fontFamily: FONTS.bodyExtraBold,
  },
});
