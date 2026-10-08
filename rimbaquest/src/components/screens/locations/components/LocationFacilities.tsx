import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { FONTS } from "../../../../constants/fonts";
import { LOCATION_COLORS } from "../locationsTheme";

export function LocationFacilities({ facilities }: { facilities: string[] }) {
  if (!facilities.length) return null;

  return (
    <View style={styles.chips}>
      {facilities.map((fac) => (
        <View key={fac} style={styles.chip}>
          <Text style={styles.text}>{fac}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 6,
    backgroundColor: LOCATION_COLORS.facilityBg,
    borderWidth: 1.5,
    borderColor: LOCATION_COLORS.facilityBorder,
    borderRadius: 999,
  },
  text: {
    color: LOCATION_COLORS.brownText,
    fontSize: 11,
    fontFamily: FONTS.bodyExtraBold,
  },
});
