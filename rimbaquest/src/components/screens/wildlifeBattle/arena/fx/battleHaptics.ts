// Phone buzz when the explorer's own card takes a hit.
import * as Haptics from "expo-haptics";
import { Platform } from "react-native";

const TICK_GAP_MS = 350; // matches the stagger between floating damage numbers

/** Buzzes once per damage tick from the moment the hit lands. Returns a cancel function. */
export function scheduleHitHaptics(
  impactAt: number,
  ticks: number,
  heavy: boolean,
): () => void {
  // if (Platform.OS === "web") return () => {};
  const style = heavy
    ? Haptics.ImpactFeedbackStyle.Heavy
    : Haptics.ImpactFeedbackStyle.Medium;
  const timers = Array.from({ length: Math.max(1, ticks) }, (_, index) =>
    setTimeout(
      () => void Haptics.impactAsync(style).catch(() => {}),
      impactAt + index * TICK_GAP_MS,
    ),
  );
  return () => timers.forEach(clearTimeout);
}
