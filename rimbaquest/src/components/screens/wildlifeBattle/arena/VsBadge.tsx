// Pulsing orange "VS" coin between the two cards.
import React from "react";
import { Animated, StyleSheet, Text } from "react-native";
import { FONTS } from "../../../../constants/fonts";
import { GAME_COLORS } from "../../../common/game/gameTheme";
import { useLoop } from "../shared/useLoop";
import { outlined } from "./arenaText";

const INK = GAME_COLORS.ink;

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
    marginLeft: -35,
    marginTop: -35,
    zIndex: 5,
    width: 70,
    height: 70,
    borderRadius: 35,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFB938",
    borderWidth: 4,
    borderColor: INK,
    boxShadow: `0px 0px 0px 5px ${GAME_COLORS.woodText}, 0px 0px 0px 8px ${INK}, 0px 7px 0px 3px ${INK}`,
  },
  text: {
    fontFamily: FONTS.display,
    fontSize: 28,
    color: "#FFFFFF",
    ...outlined("#7A3500"),
  },
});
