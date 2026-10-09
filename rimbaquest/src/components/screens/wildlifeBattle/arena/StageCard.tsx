import React from "react";
import {
  Animated,
  LayoutChangeEvent,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from "react-native";
import { FONTS } from "../../../../constants/fonts";
import { GAME_COLORS } from "../../../common/game/gameTheme";
import { WildlifeCombatant } from "../../../../types/wildlifeMatch";
import { floatStyle, useLoop } from "../shared/useLoop";
import { AnimalCard } from "./AnimalCard";
import { outlined } from "./arenaText";

const INK = GAME_COLORS.ink;

function TurnBubble({ label }: { label: string }) {
  const bob = useLoop(700);
  return (
    <Animated.View
      style={[styles.bubble, floatStyle(bob)]}
      accessibilityRole="text"
      accessibilityLiveRegion="polite"
    >
      <View style={styles.bubbleFace}>
        <Text style={styles.bubbleText}>{label}</Text>
      </View>
      <View style={styles.bubbleArrow} />
    </Animated.View>
  );
}

export function StageCard({
  combatant,
  tag,
  tagColor,
  turnLabel,
  tilt,
  width,
  photoHeight,
  motionStyle,
  onLayout,
}: {
  combatant: WildlifeCombatant;
  tag: string;
  tagColor: string;
  turnLabel: string | null;
  tilt: number;
  width: number;
  photoHeight: number;
  motionStyle: StyleProp<ViewStyle> | null;
  onLayout: (event: LayoutChangeEvent) => void;
}) {
  return (
    <Animated.View style={[styles.slot, motionStyle]} onLayout={onLayout}>
      {turnLabel ? (
        <TurnBubble label={turnLabel} />
      ) : (
        <View style={styles.bubbleSpacer} />
      )}
      <AnimalCard
        combatant={combatant}
        tag={tag}
        tagColor={tagColor}
        active={Boolean(turnLabel)}
        tilt={tilt}
        width={width}
        photoHeight={photoHeight}
      />
      <View style={[styles.shadow, { width: width - 10 }]} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  slot: { alignItems: "center" },
  shadow: {
    height: 14,
    marginTop: 8,
    borderRadius: 999,
    backgroundColor: "rgba(60, 40, 10, 0.3)",
  },
  bubble: { alignItems: "center", marginBottom: 6, height: 40 },
  bubbleSpacer: { height: 40, marginBottom: 6 },
  bubbleFace: {
    backgroundColor: "#E2701A",
    borderWidth: 3,
    borderColor: INK,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 2,
    boxShadow: `0px 3px 0px ${INK}`,
  },
  bubbleText: {
    fontFamily: FONTS.display,
    fontSize: 15,
    color: "#FFFFFF",
    ...outlined("#7A3500"),
  },
  bubbleArrow: {
    width: 0,
    height: 0,
    marginTop: -1,
    borderLeftWidth: 9,
    borderRightWidth: 9,
    borderTopWidth: 11,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderTopColor: INK,
  },
});
