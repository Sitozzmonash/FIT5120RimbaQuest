import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";
import { FONTS } from "../../../../constants/fonts";
import { HOME_COLORS } from "../homeTheme";

// Speech bubble on the map, with its tail pointing right at a node. Pops in
// when it appears.
export function MapHintBubble({
  text,
  left,
  top,
  width,
}: {
  text: string;
  left: number;
  top: number;
  width: number;
}) {
  const appear = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(appear, {
      toValue: 1,
      speed: 20,
      bounciness: 8,
      useNativeDriver: true,
    }).start();
  }, [appear]);

  return (
    <Animated.View
      accessibilityRole="text"
      accessibilityLiveRegion="polite"
      style={[
        styles.bubble,
        {
          left,
          top,
          width,
          opacity: appear,
          transform: [
            {
              scale: appear.interpolate({
                inputRange: [0, 1],
                outputRange: [0.85, 1],
              }),
            },
          ],
        },
      ]}
    >
      <View style={styles.tail} />
      <Text style={styles.text}>{text}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  bubble: {
    position: "absolute",
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: HOME_COLORS.paper,
    borderWidth: 3,
    borderBottomWidth: 7,
    borderColor: HOME_COLORS.ink,
    borderRadius: 14,
    pointerEvents: "none",
  },
  tail: {
    position: "absolute",
    right: -11,
    top: 16,
    width: 16,
    height: 16,
    backgroundColor: HOME_COLORS.paper,
    borderTopWidth: 3,
    borderRightWidth: 3,
    borderColor: HOME_COLORS.ink,
    transform: [{ rotate: "45deg" }],
  },
  text: {
    fontFamily: FONTS.bodyExtraBold,
    color: "#3D5443",
    fontSize: 13,
    lineHeight: 17.5,
  },
});
