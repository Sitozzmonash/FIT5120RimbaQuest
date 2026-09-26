import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { FONTS } from "../../../../../constants/fonts";
import { DashedDivider } from "../../../../common/game/DashedDivider";
import { DETAIL_COLORS, fieldLabelStyle } from "./detailTheme";

export function InfoField({
  label,
  value,
  italic = false,
}: {
  label: string;
  value: string;
  italic?: boolean;
}) {
  return (
    <View style={styles.field}>
      <Text style={fieldLabelStyle}>{label}</Text>
      <Text style={[styles.value, italic && styles.italic]}>{value}</Text>
      <View style={styles.divider}>
        <DashedDivider />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  field: { gap: 2 },
  value: {
    fontFamily: FONTS.bodyExtraBold,
    color: DETAIL_COLORS.heading,
    fontSize: 14,
    lineHeight: 19,
  },
  italic: { fontStyle: "italic" },
  divider: { marginTop: 8 },
});
