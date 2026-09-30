import React from "react";
import { Image, StyleSheet, Text, View } from "react-native";
import { FONTS } from "../../../../../constants/fonts";
import { LOCKED_COLORS, LOCKED_IMAGES } from "./lockedAssets";

export function NotFoundPill() {
  return (
    <View style={styles.pill}>
      {/* <Image
        source={LOCKED_IMAGES.lock}
        style={styles.icon}
        resizeMode="contain"
      /> */}
      <Text style={styles.text}>NOT FOUND YET</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: LOCKED_COLORS.orange,
    borderWidth: 3,
    borderColor: LOCKED_COLORS.ink,
    borderRadius: 999,
  },
  icon: { width: 20, height: 20 },
  text: {
    fontFamily: FONTS.display,
    color: "#FFFFFF",
    fontSize: 15,
    textShadowColor: "#7A3500",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 1,
  },
});
