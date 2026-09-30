import React from "react";
import { Image, StyleSheet, Text, View } from "react-native";
import { FONTS } from "../../../../../constants/fonts";
import { LOCKED_COLORS, LOCKED_IMAGES } from "./lockedAssets";

export function KeepExploringBanner() {
  return (
    <View style={styles.banner}>
      <Image
        source={LOCKED_IMAGES.camera}
        style={styles.camera}
        resizeMode="contain"
      />
      <Text style={styles.text}>
        Keep exploring! Take a photo of this animal in nature to earn its card!
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    minHeight: 76 + 5,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: LOCKED_COLORS.mint,
    borderWidth: 3,
    borderBottomWidth: 8,
    borderColor: LOCKED_COLORS.ink,
    borderRadius: 18,
  },
  camera: { width: 54, height: 54 },
  text: {
    flex: 1,
    fontFamily: FONTS.bodyExtraBold,
    color: LOCKED_COLORS.mintText,
    fontSize: 15,
    lineHeight: 21,
  },
});
