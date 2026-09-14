import React from "react";
import { Image, StyleSheet, Text, View } from "react-native";
import { HOME_IMAGES } from "../../../../constants/images";
import { useDiscoveryStore } from "../../../../store/useDiscoveryStore";
import { Tap } from "../../../common/Tap";

export function CollectionCaptureBanner() {
  return (
    <View style={styles.collectionLevelUpBannerWrap}>
      <View style={styles.collectionLevelUpBanner}>
        <View style={styles.collectionLevelUpCopy}>
          <Text style={styles.collectionLevelUpTitle}>Find More Animals</Text>
          <Text style={styles.collectionLevelUpSubtitle}>
            Take photos and add more.
          </Text>
        </View>
      </View>
      <Tap
        label="Take a photo to find more animals"
        style={styles.collectionCaptureDecor}
        onPress={() => useDiscoveryStore.getState().start()}
      >
        <Image
          source={HOME_IMAGES.tileCapture}
          style={styles.collectionCaptureImage}
          resizeMode="contain"
        />
      </Tap>
    </View>
  );
}

const styles = StyleSheet.create({
  collectionLevelUpBannerWrap: {
    position: "relative",
    marginHorizontal: 24,
    marginBottom: 18,
    paddingTop: 8,
  },
  collectionLevelUpBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  collectionLevelUpCopy: { flex: 1, gap: 4 },
  collectionLevelUpTitle: { color: "#FFFFFF", fontSize: 20, fontWeight: "900" },
  collectionLevelUpSubtitle: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 13,
    fontWeight: "600",
    lineHeight: 18,
  },
  collectionCaptureDecor: {
    position: "absolute",
    bottom: -28,
    right: -6,
    width: 130,
    height: 92,
    zIndex: 3,
  },
  collectionCaptureImage: { width: "100%", height: "100%" },
});
