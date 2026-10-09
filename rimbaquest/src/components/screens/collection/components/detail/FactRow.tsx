import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { FONTS } from "../../../../../constants/fonts";
import { DashedDivider } from "../../../../common/game/DashedDivider";
import { DETAIL_COLORS } from "./detailTheme";

export function FactRow({ number, text }: { number: number; text: string }) {
  return (
    <View>
      <View style={styles.row}>
        <View style={styles.coin}>
          <Text style={styles.number}>{number}</Text>
        </View>
        <Text style={styles.text}>{text}</Text>
      </View>
      <DashedDivider />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    paddingVertical: 8,
  },
  coin: {
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: DETAIL_COLORS.green,
    borderWidth: 2,
    borderColor: DETAIL_COLORS.ink,
    borderRadius: 14,
    overflow: "hidden",
  },
  number: { fontFamily: FONTS.display, color: "#FFFFFF", fontSize: 15 },
  text: {
    flex: 1,
    fontFamily: FONTS.bodyExtraBold,
    color: DETAIL_COLORS.heading,
    fontSize: 14,
  },
});
