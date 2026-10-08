import React from "react";
import { StyleSheet, View } from "react-native";
import { GAME_COLORS } from "../../../common/game/gameTheme";

const INK = GAME_COLORS.ink;

export function Paper({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: object;
}) {
  return <View style={[styles.paper, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  paper: {
    gap: 10,
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: GAME_COLORS.paper,
    borderWidth: 3,
    borderColor: INK,
    borderRadius: 20,
    boxShadow: `0px 5px 0px ${INK}`,
  },
});
