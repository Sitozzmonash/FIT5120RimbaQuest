import React from "react";
import {
  Image,
  ImageSourcePropType,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { FONTS } from "../../../../../constants/fonts";
import { DETAIL_COLORS, fieldLabelStyle } from "./detailTheme";

// White stat box: icon on the left, small label over a big number.
export function StatTile({
  label,
  value,
  icon,
  iconSize,
  color,
}: {
  label: string;
  value: number | string;
  icon: ImageSourcePropType;
  iconSize: { width: number; height: number };
  color: string;
}) {
  return (
    <View style={styles.tile}>
      <View style={styles.iconSlot}>
        <Image source={icon} style={iconSize} resizeMode="contain" />
      </View>
      <View style={styles.text}>
        <Text style={fieldLabelStyle}>{label}</Text>
        <Text style={[styles.value, { color }]} numberOfLines={1}>
          {value}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  tile: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    height: 62 + 4,
    paddingHorizontal: 12,
    backgroundColor: "#FFFFFF",
    borderWidth: 3,
    borderColor: DETAIL_COLORS.ink,
    borderRadius: 14,
  },
  iconSlot: {
    width: 30,
    height: 30,
    alignItems: "center",
    justifyContent: "center",
  },
  text: { flex: 1 },
  value: { fontFamily: FONTS.display, fontSize: 30, lineHeight: 30 },
});
