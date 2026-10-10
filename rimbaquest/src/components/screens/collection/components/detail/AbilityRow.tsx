import React from "react";
import { Image, StyleSheet, Text, View } from "react-native";
import { FONTS } from "../../../../../constants/fonts";
import { ScaleTap } from "../../../../common/ScaleTap";
import { DETAIL_COLORS, DETAIL_IMAGES } from "./detailTheme";

export function AbilityRow({
  slot,
  name,
  description,
  isUnlocked,
  isNextToUnlock,
  onUnlock,
  onDetails,
}: {
  slot: number;
  name: string;
  description?: string;
  isUnlocked: boolean;
  isNextToUnlock: boolean;
  onUnlock: () => void;
  onDetails: () => void;
}) {
  const title = `Ability ${slot}: ${name}`;

  if (isUnlocked) {
    return (
      <ScaleTap
        label={`View ${title} details`}
        style={[styles.row, styles.unlocked]}
        onPress={onDetails}
        pressedScale={0.96}
      >
        <View style={styles.highlight} />
        <View style={styles.text}>
          <Text style={[styles.title, styles.titleUnlocked]}>{title}</Text>
          {description ? (
            <Text style={[styles.subtitle, styles.subtitleUnlocked]}>
              {description}
            </Text>
          ) : null}
        </View>
      </ScaleTap>
    );
  }

  const content = (
    <>
      <View style={styles.text}>
        <Text style={[styles.title, isNextToUnlock ? styles.titleAvailable : styles.titleLocked]}>{title}</Text>
        <Text style={[styles.subtitle, isNextToUnlock ? styles.subtitleAvailable : styles.subtitleLocked]}>
          {isNextToUnlock ? "Complete a quiz to unlock" : "Locked • Tap for details"}
        </Text>
      </View>
      {isNextToUnlock ? (
        <View style={styles.quizBadge}>
          <Text style={styles.quizBadgeText}>UNLOCK</Text>
        </View>
      ) : (
        <Image
          source={DETAIL_IMAGES.lock}
          style={styles.lock}
          resizeMode="contain"
        />
      )}
    </>
  );

  return isNextToUnlock ? (
    <ScaleTap
      label={`Start quiz to unlock ${title}`}
      style={[styles.row, styles.available]}
      onPress={onUnlock}
      pressedScale={0.96}
    >
      {content}
    </ScaleTap>
  ) : (
    <ScaleTap
      label={`View locked ${title} details`}
      style={[styles.row, styles.locked]}
      onPress={onDetails}
      pressedScale={0.96}
    >
      {content}
    </ScaleTap>
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
  available: { backgroundColor: "#FFE5A1", borderColor: "#B76100" },
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
  titleAvailable: { color: DETAIL_COLORS.heading },
  subtitle: { fontFamily: FONTS.bodyExtraBold, fontSize: 13 },
  subtitleUnlocked: { color: "#EAF7E3" },
  subtitleLocked: { color: "#5E5946" },
  subtitleAvailable: { color: "#6A3900" },
  quizBadge: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: DETAIL_COLORS.ink,
  },
  quizBadgeText: { fontFamily: FONTS.bodyBlack, fontSize: 11, color: "#FFFFFF" },
  lock: { width: 28.66, height: 34 },
});
