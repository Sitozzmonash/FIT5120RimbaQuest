import React from "react";
import { LayoutChangeEvent, StyleSheet, View } from "react-native";
import { DashedDivider } from "../../../common/game/DashedDivider";
import { GAME_COLORS } from "../../../common/game/gameTheme";
import { CollectionCaptureBanner } from "./CollectionCaptureBanner";
import { CollectionProgressCard } from "./CollectionProgressCard";

export function CollectionHeroSection({
  onLayout,
}: {
  onLayout: (e: LayoutChangeEvent) => void;
}) {
  return (
    <View style={styles.section} onLayout={onLayout}>
      <View style={styles.card}>
        <CollectionProgressCard />
        <DashedDivider />
        <CollectionCaptureBanner />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { paddingBottom: 0 },
  card: {
    marginHorizontal: 16,
    gap: 14,
    padding: 16,
    backgroundColor: GAME_COLORS.paper,
    borderWidth: 3,
    borderBottomWidth: 8,
    borderColor: GAME_COLORS.ink,
    borderRadius: 20,
  },
});
