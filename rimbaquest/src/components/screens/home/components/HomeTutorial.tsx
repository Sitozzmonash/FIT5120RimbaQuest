import React from "react";
import { MaterialIcons } from "@expo/vector-icons";
import { Image, ImageSourcePropType, Pressable, StyleSheet, Text, View, ViewStyle } from "react-native";
import { FONTS } from "../../../../constants/fonts";
import { Tap } from "../../../common/Tap";
import { HOME_COLORS } from "../homeTheme";

const STEPS = [
  {
    title: "Your profile",
    message: "My Camp shows your explorer profile, level, and progress.",
    target: { left: 113, top: 15, width: 226, height: 90 },
    card: { left: 70, top: 118, width: 270 },
    tail: { side: "top", offset: 140 },
  },
  {
    title: "Discover",
    message: "Discover helps you find places to explore and learn where wild animals may live.",
    target: { left: 10, top: 145, width: 162, height: 150 },
    card: { left: 176, top: 157, width: 210 },
    tail: { side: "left", offset: 54 },
  },
  {
    title: "Capture",
    message: "Capture lets you photograph wild animals you find. Capturing one unlocks Battle.",
    target: { left: 188, top: 207, width: 186, height: 177 },
    card: { left: -12, top: 203, width: 200 },
    tail: { side: "right", offset: 69 },
  },
  {
    title: "Collection",
    message: "Collection keeps the animals you've discovered so you can revisit and learn about them.",
    target: { left: 10, top: 325, width: 162, height: 154 },
    card: { left: 176, top: 320, width: 204 },
    tail: { side: "left", offset: 70 },
  },
  {
    title: "Battle",
    message: "Battle lets you play with the animals you've captured.",
    target: { left: 202, top: 407, width: 162, height: 153 },
    card: { left: 112, top: 230, width: 250 },
    tail: { side: "bottom", offset: 154 },
  },
  {
    title: "Pick up where you left off",
    message: "Animals you looked at recently appear here. Tap one to keep learning, or swipe up to see more.",
    target: null,
    card: { left: 50, top: 358, width: 290 },
    tail: { side: "bottom", offset: 131 },
  },
  {
    title: "Ready to explore!",
    message: "If you feel stuck, tap this Tutorial sign to see the guide again. Now let's start RimbaQuest!",
    target: { left: 238, top: 119, width: 144, height: 73 },
    card: { left: 112, top: 205, width: 255 },
    tail: { side: "top", offset: 185 },
  },
] as const;

export const TUTORIAL_STEP_COUNT = STEPS.length;

export function tutorialHighlightsResumeSheet(step: number | null) {
  return step !== null && STEPS[step]?.target === null;
}

// Shade that blocks taps and dims everything outside the current tutorial target.
export const TUTORIAL_DIM = "rgba(6, 24, 12, 0.62)";

export function TutorialDim({ style }: { style?: ViewStyle | ViewStyle[] }) {
  return <Pressable style={[styles.dim, style]} onPress={() => {}} accessibilityLabel="Tutorial is showing" />;
}

// Map-space rectangles surrounding the target; they run far past the map edge
// so the clipped map area is fully covered at any scale.
const FAR = 4000;
type Rect = { left: number; top: number; width: number; height: number };
function dimAround(t: Rect): ViewStyle[] {
  return [
    { left: -FAR, right: -FAR, top: -FAR, height: FAR + t.top },
    { left: -FAR, right: -FAR, top: t.top + t.height, bottom: -FAR },
    { left: -FAR, width: FAR + t.left, top: t.top, height: t.height },
    { left: t.left + t.width, right: -FAR, top: t.top, height: t.height },
  ];
}
const DIM_ALL: ViewStyle[] = [{ left: -FAR, right: -FAR, top: -FAR, bottom: -FAR }];

// Gold outline drawn over the resume sheet's peek during its tutorial step.
export function ResumeSheetHighlight({ height }: { height: number }) {
  return <View pointerEvents="none" style={[styles.highlight, styles.sheetHighlight, { height }]} />;
}

export function HomeTutorial({
  step,
  avatar,
  battleReady,
  onBack,
  onNext,
  onClose,
}: {
  step: number;
  avatar: ImageSourcePropType;
  battleReady: boolean;
  onBack: () => void;
  onNext: () => void;
  onClose: () => void;
}) {
  const item = STEPS[step];
  const lockedBattle = step === 4 && !battleReady;
  return (
    <View style={styles.layer}>
      {(item.target ? dimAround(item.target) : DIM_ALL).map((rect, i) => (
        <TutorialDim key={i} style={rect} />
      ))}
      {item.target && <View style={[styles.highlight, item.target]} pointerEvents="none" />}
      <View style={[styles.card, item.card]}>
        <BubbleTail side={item.tail.side} offset={item.tail.offset} />
        <View style={styles.header}>
          <Image source={avatar} style={styles.avatar} resizeMode="cover" />
          <View style={styles.heading}>
            <Text style={styles.count}>{step + 1} / {STEPS.length}</Text>
            <Text style={styles.title}>{item.title}</Text>
          </View>
          <Tap label="Close tutorial" onPress={onClose} style={styles.close}>
            <MaterialIcons name="close" size={21} color={HOME_COLORS.ink} />
          </Tap>
        </View>
        <Text style={styles.message}>
          {lockedBattle
            ? "Capture an animal first to unlock Battle. Use Discover to find one, then photograph it."
            : item.message}
        </Text>
        <View style={styles.actions}>
          <Tap label="Previous tutorial step" onPress={onBack} disabled={step === 0} style={[styles.button, step === 0 && styles.disabled]}>
            <Text style={styles.buttonText}>Back</Text>
          </Tap>
          <Tap label={step === STEPS.length - 1 ? "Finish tutorial and start exploring" : "Next tutorial step"} onPress={onNext} style={[styles.button, styles.next]}>
            <Text style={styles.buttonText}>{step === STEPS.length - 1 ? "Let's go!" : "Next"}</Text>
          </Tap>
        </View>
      </View>
    </View>
  );
}

type TailSide = "top" | "left" | "right" | "bottom";

function BubbleTail({ side, offset }: { side: TailSide; offset: number }) {
  const axis = side === "top" || side === "bottom" ? "left" : "top";
  return (
    <>
      <View pointerEvents="none" style={[styles.tail, outerTail[side], { [axis]: offset }]} />
      <View pointerEvents="none" style={[styles.tail, innerTail[side], { [axis]: offset + 4 }]} />
    </>
  );
}

const transparent = "transparent";
const outerTail: Record<TailSide, ViewStyle> = {
  top: { top: -18, borderLeftWidth: 14, borderRightWidth: 14, borderBottomWidth: 18, borderLeftColor: transparent, borderRightColor: transparent, borderBottomColor: HOME_COLORS.ink },
  bottom: { bottom: -18, borderLeftWidth: 14, borderRightWidth: 14, borderTopWidth: 18, borderLeftColor: transparent, borderRightColor: transparent, borderTopColor: HOME_COLORS.ink },
  left: { left: -18, borderTopWidth: 14, borderBottomWidth: 14, borderRightWidth: 18, borderTopColor: transparent, borderBottomColor: transparent, borderRightColor: HOME_COLORS.ink },
  right: { right: -18, borderTopWidth: 14, borderBottomWidth: 14, borderLeftWidth: 18, borderTopColor: transparent, borderBottomColor: transparent, borderLeftColor: HOME_COLORS.ink },
};
const innerTail: Record<TailSide, ViewStyle> = {
  top: { top: -12, borderLeftWidth: 10, borderRightWidth: 10, borderBottomWidth: 14, borderLeftColor: transparent, borderRightColor: transparent, borderBottomColor: HOME_COLORS.paper },
  bottom: { bottom: -12, borderLeftWidth: 10, borderRightWidth: 10, borderTopWidth: 14, borderLeftColor: transparent, borderRightColor: transparent, borderTopColor: HOME_COLORS.paper },
  left: { left: -12, borderTopWidth: 10, borderBottomWidth: 10, borderRightWidth: 14, borderTopColor: transparent, borderBottomColor: transparent, borderRightColor: HOME_COLORS.paper },
  right: { right: -12, borderTopWidth: 10, borderBottomWidth: 10, borderLeftWidth: 14, borderTopColor: transparent, borderBottomColor: transparent, borderLeftColor: HOME_COLORS.paper },
};

const styles = StyleSheet.create({
  // Above wandering critters (which use zIndex for depth) on both platforms.
  layer: { ...StyleSheet.absoluteFill, zIndex: 1000, elevation: 30 },
  dim: { position: "absolute", backgroundColor: TUTORIAL_DIM },
  highlight: {
    position: "absolute", borderWidth: 4, borderColor: HOME_COLORS.goldLight,
    borderRadius: 20, backgroundColor: "rgba(255, 214, 110, 0.13)",
    shadowColor: HOME_COLORS.goldLight, shadowOpacity: 0.9, shadowRadius: 12,
    elevation: 8,
  },
  sheetHighlight: { left: 4, right: 4, bottom: 0, borderBottomLeftRadius: 0, borderBottomRightRadius: 0, borderRadius: 28 },
  card: {
    position: "absolute", padding: 12, borderRadius: 18,
    backgroundColor: HOME_COLORS.paper, borderWidth: 3, borderColor: HOME_COLORS.ink,
    shadowColor: "#102C18", shadowOpacity: 0.4, shadowRadius: 6, elevation: 10,
  },
  tail: { position: "absolute", width: 0, height: 0 },
  header: { flexDirection: "row", alignItems: "center", gap: 9 },
  avatar: { width: 38, height: 38, borderRadius: 19, borderWidth: 2, borderColor: HOME_COLORS.ink },
  heading: { flex: 1 },
  count: { fontFamily: FONTS.bodyBold, color: "#53715D", fontSize: 12 },
  title: { fontFamily: FONTS.display, color: HOME_COLORS.ink, fontSize: 18 },
  close: { width: 31, height: 31, alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: HOME_COLORS.ink, borderRadius: 16, backgroundColor: "#D8ECCE" },
  message: { fontFamily: FONTS.bodyBold, color: HOME_COLORS.ink, fontSize: 14, lineHeight: 19, marginTop: 9 },
  actions: { flexDirection: "row", gap: 8, marginTop: 11 },
  button: { flex: 1, paddingVertical: 7, alignItems: "center", backgroundColor: "#D8ECCE", borderRadius: 9, borderWidth: 2, borderColor: HOME_COLORS.ink },
  next: { backgroundColor: HOME_COLORS.goldLight },
  disabled: { opacity: 0.4 },
  buttonText: { fontFamily: FONTS.bodyExtraBold, fontSize: 14, color: HOME_COLORS.ink },
});
