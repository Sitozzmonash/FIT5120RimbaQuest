import React from "react";
import { Image, StyleSheet, Text, View } from "react-native";
import { FONTS } from "../../../../../constants/fonts";
import { LOCKED_COLORS, LOCKED_IMAGES } from "./lockedAssets";

export function WhereToLookRow({ habitat }: { habitat: string }) {
  return (
    <View style={styles.row}>
      <View style={styles.iconWrap}>
        <Image
          source={LOCKED_IMAGES.map}
          style={styles.icon}
          resizeMode="contain"
        />
      </View>
      <View style={styles.text}>
        <Text style={styles.title}>Where to Look</Text>
        <Text style={styles.habitat}>{habitat}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    alignSelf: "stretch",
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    padding: 12,
    backgroundColor: "#FFFFFF",
    borderWidth: 3,
    borderColor: LOCKED_COLORS.ink,
    borderRadius: 16,
  },
  iconWrap: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: LOCKED_COLORS.mint,
    borderWidth: 2,
    borderColor: LOCKED_COLORS.ink,
    borderRadius: 12,
  },
  icon: { width: 30, height: 30 },
  text: { flex: 1, gap: 2 },
  title: {
    fontFamily: FONTS.display,
    color: LOCKED_COLORS.heading,
    fontSize: 17,
  },
  habitat: {
    fontFamily: FONTS.bodyBold,
    color: LOCKED_COLORS.body,
    fontSize: 14,
    lineHeight: 19.6,
  },
});
