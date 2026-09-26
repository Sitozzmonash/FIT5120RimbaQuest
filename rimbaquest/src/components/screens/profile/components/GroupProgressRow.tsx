import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { FONTS } from "../../../../constants/fonts";
import { GameProgressBar } from "../../../common/game/GameProgressBar";
import { PROFILE_COLORS } from "../profileTheme";
import { percentOf } from "../profileProgress";
import { DashedDivider } from "./DashedDivider";

export function GroupProgressRow({
  label,
  found,
  total,
  last = false,
}: {
  label: string;
  found: number;
  total: number;
  last?: boolean;
}) {
  return (
    <View style={styles.group}>
      <View style={styles.heading}>
        <Text style={styles.label} numberOfLines={1}>
          {label}
        </Text>
        <Text style={styles.count}>
          {found} / {total}
        </Text>
      </View>
      <GameProgressBar percent={percentOf(found, total)} height={12} />
      {!last && (
        <View style={styles.divider}>
          <DashedDivider />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  group: { gap: 4 },
  divider: { marginTop: 4 },
  heading: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
    gap: 10,
  },
  label: {
    flex: 1,
    fontFamily: FONTS.bodyBlack,
    color: PROFILE_COLORS.heading,
    fontSize: 15,
  },
  count: {
    fontFamily: FONTS.display,
    color: PROFILE_COLORS.label,
    fontSize: 16,
  },
});
