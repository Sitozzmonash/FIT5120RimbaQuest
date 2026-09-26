import React, { useEffect, useRef } from "react";
import { Animated, Easing, ImageStyle, StyleProp } from "react-native";

const RAYS = require("../../../../assets/collection/perk-rays.png");

export function SpinningRays({
  size = 1000,
  durationMs = 40000,
  style,
}: {
  size?: number;
  durationMs?: number;
  style?: StyleProp<ImageStyle>;
}) {
  const turn = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(turn, {
        toValue: 1,
        duration: durationMs,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [turn, durationMs]);

  const rotate = turn.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  return (
    <Animated.Image
      source={RAYS}
      resizeMode="contain"
      style={[
        { width: size, height: size },
        style,
        { transform: [{ rotate }] },
      ]}
    />
  );
}
