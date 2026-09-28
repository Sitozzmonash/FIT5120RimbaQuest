import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { FONTS } from "../../../../constants/fonts";
import { DashedDivider } from "../../../common/game/DashedDivider";
import { DISCOVERY_COLORS } from "./discoveryTheme";

export function SuccessSummary({
  rows,
}: {
  rows: { label: string; value: string }[];
}) {
  return (
    <View style={styles.box}>
      {rows.map((row, index) => (
        <React.Fragment key={row.label}>
          {index > 0 && <DashedDivider />}
          <View style={styles.row}>
            <Text style={styles.label}>{row.label}</Text>
            <Text style={styles.value} numberOfLines={1}>
              {row.value}
            </Text>
          </View>
        </React.Fragment>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    alignSelf: "stretch",
    gap: 10,
    padding: 16,
    backgroundColor: DISCOVERY_COLORS.paper,
    borderWidth: 2,
    borderBottomWidth: 6,
    borderColor: DISCOVERY_COLORS.ink,
    borderRadius: 20,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  label: {
    fontFamily: FONTS.bodyBold,
    color: DISCOVERY_COLORS.body,
    fontSize: 12,
  },
  value: {
    flexShrink: 1,
    fontFamily: FONTS.bodyBlack,
    color: DISCOVERY_COLORS.heading,
    fontSize: 14,
    textAlign: "right",
  },
});
