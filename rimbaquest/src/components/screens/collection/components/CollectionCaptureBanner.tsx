import React from "react";
import { Image, StyleSheet, Text, View } from "react-native";
import { FONTS } from "../../../../constants/fonts";
import { useDiscoveryStore } from "../../../../store/useDiscoveryStore";
import { GAME_COLORS } from "../../../common/game/gameTheme";
import { ScaleTap } from "../../../common/ScaleTap";
import { LOCKED_IMAGES } from "./locked/lockedAssets";

export function CollectionCaptureBanner() {
  return (
    <View style={styles.row}>
      <View style={styles.copy}>
        <Text style={styles.title}>Find More Animals</Text>
        <Text style={styles.subtitle}>Take photos and add more.</Text>
      </View>
      <ScaleTap
        label="Take a photo to find more animals"
        style={styles.camera}
        onPress={() => useDiscoveryStore.getState().start()}
      >
        <Image
          source={LOCKED_IMAGES.camera}
          style={styles.cameraImage}
          resizeMode="contain"
        />
      </ScaleTap>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 12 },
  copy: { flex: 1, gap: 2 },
  title: {
    fontFamily: FONTS.display,
    color: GAME_COLORS.heading,
    fontSize: 19,
  },
  subtitle: {
    fontFamily: FONTS.bodyBold,
    color: GAME_COLORS.body,
    fontSize: 13,
    lineHeight: 18,
  },
  camera: { width: 92, height: 64 },
  cameraImage: { width: "100%", height: "100%" },
});
