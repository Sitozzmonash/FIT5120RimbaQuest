import React from "react";
import { Image, StyleSheet, Text, View } from "react-native";
import { FONTS } from "../../../../../constants/fonts";
import { ScaleTap } from "../../../../common/ScaleTap";
import { DETAIL_COLORS, DETAIL_IMAGES } from "./detailTheme";

// One special ability: green when unlocked, stone-coloured and padlocked when
// not. The next ability to earn can be tapped to start its quiz.
export function AbilityRow({
  slot,
  name,
  description,
  isUnlocked,
  isNextToUnlock,
  onUnlock,
}: {
  slot: number;
  name: string;
  description?: string;
  isUnlocked: boolean;
  isNextToUnlock: boolean;
  onUnlock: () => void;
}) {
  const title = `Ability ${slot}: ${name}`;

  if (isUnlocked) {
    return (
      <View style={[styles.row, styles.unlocked]}>
        <View style={styles.highlight} />
        <View style={styles.text}>
          <Text style={[styles.title, styles.titleUnlocked]}>{title}</Text>
          {description ? (
            <Text style={[styles.subtitle, styles.subtitleUnlocked]}>
              {description}
            </Text>
          ) : null}
        </View>
      </View>
    );
  }

  const content = (
    <>
      <View style={styles.text}>
        <Text style={[styles.title, styles.titleLocked]}>{title}</Text>
        <Text style={[styles.subtitle, styles.subtitleLocked]}>
          {isNextToUnlock ? "Tap to unlock" : "Locked"}
        </Text>
      </View>
      <Image
        source={DETAIL_IMAGES.lock}
        style={styles.lock}
        resizeMode="contain"
      />
    </>
  );

  return isNextToUnlock ? (
    <ScaleTap
      label={`Unlock ${title}`}
      style={[styles.row, styles.locked]}
      onPress={onUnlock}
      pressedScale={0.96}
    >
      {content}
    </ScaleTap>
  ) : (
    <View style={[styles.row, styles.locked]}>{content}</View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    minHeight: 64 + 4,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 3,
    borderBottomWidth: 7,
    borderRadius: 16,
    overflow: "hidden",
  },
  unlocked: {
    backgroundColor: DETAIL_COLORS.green,
    borderColor: DETAIL_COLORS.ink,
  },
  locked: { backgroundColor: "#E4D6B4", borderColor: "#6F6A55" },
  highlight: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 4,
    backgroundColor: "rgba(255, 255, 255, 0.25)",
  },
  text: { flex: 1, gap: 2 },
  title: { fontFamily: FONTS.display, fontSize: 17 },
  titleUnlocked: {
    color: "#FFFFFF",
    textShadowColor: DETAIL_COLORS.ink,
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 1,
  },
  titleLocked: { color: "#4E4A3A" },
  subtitle: { fontFamily: FONTS.bodyExtraBold, fontSize: 13 },
  subtitleUnlocked: { color: "#EAF7E3" },
  subtitleLocked: { color: "#5E5946" },
  lock: { width: 28.66, height: 34 },
});
