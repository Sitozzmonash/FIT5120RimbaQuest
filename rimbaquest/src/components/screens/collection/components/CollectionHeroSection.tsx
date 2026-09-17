import React from "react";
import { LayoutChangeEvent, StyleSheet, View } from "react-native";
import { CollectionWaveBackground } from "./CollectionWaveBackground";
import { CollectionProgressCard } from "./CollectionProgressCard";
import { CollectionCaptureBanner } from "./CollectionCaptureBanner";

export function CollectionHeroSection({
  waveWidth,
  heroHeight,
  onLayout,
}: {
  waveWidth: number;
  heroHeight: number;
  onLayout: (e: LayoutChangeEvent) => void;
}) {
  return (
    <View style={styles.collectionHeroSection} onLayout={onLayout}>
      <CollectionWaveBackground width={waveWidth} heroHeight={heroHeight} />
      <CollectionProgressCard />
      <CollectionCaptureBanner />
    </View>
  );
}

const styles = StyleSheet.create({
  collectionHeroSection: { position: "relative" },
});
