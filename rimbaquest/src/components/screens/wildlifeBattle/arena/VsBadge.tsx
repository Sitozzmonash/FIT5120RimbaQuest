// Pulsing orange "VS" coin between the two cards.
import React from "react";
import { Animated, StyleSheet, Text } from "react-native";
import { FONTS } from "../../../../constants/fonts";
import { GAME_COLORS } from "../../../common/game/gameTheme";
import { useLoop } from "../shared/useLoop";
import { outlined } from "./arenaText";

const INK = GAME_COLORS.ink;
const SIZE = 54;
const LIFT = -5; // sits a little above centre so it covers less of the cards

export function VsBadge() {
  const pulse = useLoop(900);
  return (
    <Animated.View
      style={[
        styles.badge,
        {
          transform: [
            {
              scale: pulse.interpolate({
                inputRange: [0, 1],
                outputRange: [1, 1.1],
              }),
            },
          ],
        },
      ]}
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <Text style={styles.text}>VS</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  badge: {
    position: "absolute",
    left: "50%",
    top: "50%",
    marginLeft: -SIZE / 2,
    marginTop: -SIZE / 2 - LIFT,
    zIndex: 5,
    width: SIZE,
    height: SIZE,
    borderRadius: SIZE / 2,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFB938",
    borderWidth: 3,
    borderColor: INK,
    boxShadow: `0px 0px 0px 4px ${GAME_COLORS.woodText}, 0px 0px 0px 6px ${INK}, 0px 5px 0px 2px ${INK}`,
  },
  text: {
    fontFamily: FONTS.display,
    fontSize: 18,
    color: "#FFFFFF",
    ...outlined("#7A3500"),
  },
});
