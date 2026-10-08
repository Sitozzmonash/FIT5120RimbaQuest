import { useEffect, useRef, useState } from "react";
import { AccessibilityInfo, Animated, Easing } from "react-native";

/** Whether the phone asks for less motion; the battle screens hold their idle animations still. */
export function useReduceMotion(): boolean {
  const [reduceMotion, setReduceMotion] = useState(false);
  useEffect(() => {
    void AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);
    const sub = AccessibilityInfo.addEventListener(
      "reduceMotionChanged",
      setReduceMotion,
    );
    return () => sub.remove();
  }, []);
  return reduceMotion;
}

/** 0 -> 1 -> 0 forever, for idle floats, pulses and blinking dots. Still when reduce motion is on. */
export function useLoop(duration: number, enabled = true): Animated.Value {
  const value = useRef(new Animated.Value(0)).current;
  const reduceMotion = useReduceMotion();
  const running = enabled && !reduceMotion;
  useEffect(() => {
    if (!running) {
      value.setValue(0);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(value, {
          toValue: 1,
          duration,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(value, {
          toValue: 0,
          duration,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [value, duration, running]);
  return value;
}

/** translateY style for a gentle up-and-down float driven by a useLoop value. */
export function floatStyle(loop: Animated.Value, distance = 6) {
  return {
    transform: [
      {
        translateY: loop.interpolate({
          inputRange: [0, 1],
          outputRange: [0, -distance],
        }),
      },
    ],
  };
}
