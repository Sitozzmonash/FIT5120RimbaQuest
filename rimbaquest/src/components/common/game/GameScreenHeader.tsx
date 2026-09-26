import React from "react";
import { Image, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ScaleTap } from "../ScaleTap";
import { GAME_COLORS, outlinedTitleStyle } from "./gameTheme";

const BACK_SIZE = 46;
const CHEVRON_LEFT = require("../../../../assets/game/chevron-left.png");

// Dark green rounded header with a round back button and outlined title.
export function GameScreenHeader({
  title,
  onBack,
}: {
  title: string;
  onBack: () => void;
}) {
  const insets = useSafeAreaInsets();

  return (
    <View>
      <View style={styles.drop} />
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <ScaleTap label="Go back" style={styles.backSlot} onPress={onBack}>
          <View style={[styles.backCircle, styles.backShadow]} />
          <View style={[styles.backCircle, styles.backFace]}>
            <Image
              source={CHEVRON_LEFT}
              style={styles.chevron}
              resizeMode="contain"
            />
          </View>
        </ScaleTap>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  drop: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 5,
    bottom: -5,
    borderBottomLeftRadius: 26,
    borderBottomRightRadius: 26,
    backgroundColor: "rgba(7, 60, 29, 0.6)",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingHorizontal: 16,
    paddingBottom: 8,
    backgroundColor: GAME_COLORS.headerGreen,
    borderBottomWidth: 3,
    borderBottomColor: GAME_COLORS.ink,
    borderBottomLeftRadius: 26,
    borderBottomRightRadius: 26,
  },
  backSlot: { width: BACK_SIZE, height: BACK_SIZE + 4 },
  backCircle: {
    position: "absolute",
    width: BACK_SIZE,
    height: BACK_SIZE,
    borderRadius: BACK_SIZE / 2,
  },
  backShadow: { top: 4, backgroundColor: GAME_COLORS.ink },
  backFace: {
    top: 0,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: GAME_COLORS.paper,
    borderWidth: 3,
    borderColor: GAME_COLORS.ink,
  },
  chevron: { width: 14.5, height: 20 },
  title: {
    ...outlinedTitleStyle,
    textShadowColor: GAME_COLORS.ink,
    flexShrink: 1,
    fontSize: 24,
    lineHeight: 26.4,
  },
});
