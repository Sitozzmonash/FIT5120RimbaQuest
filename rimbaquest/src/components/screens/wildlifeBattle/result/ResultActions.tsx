import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { FONTS } from "../../../../constants/fonts";
import { GAME_COLORS } from "../../../common/game/gameTheme";
import { ScaleTap } from "../../../common/ScaleTap";

const INK = GAME_COLORS.ink;

export function ResultActions({
  bottomInset,
  onLeave,
  onRematch,
}: {
  bottomInset: number;
  onLeave: () => void;
  onRematch: () => void;
}) {
  return (
    <View style={[styles.actions, { paddingBottom: bottomInset + 16 }]}>
      <ScaleTap
        label="Leave"
        onPress={onLeave}
        style={[styles.button, styles.leave]}
      >
        <Text style={styles.leaveText}>Leave</Text>
      </ScaleTap>
      <ScaleTap
        label="Rematch"
        onPress={onRematch}
        style={[styles.button, styles.rematch]}
      >
        <Text style={styles.rematchText}>Rematch</Text>
      </ScaleTap>
    </View>
  );
}

const styles = StyleSheet.create({
  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingTop: 10,
    paddingHorizontal: 16,
    width: "100%",
    maxWidth: 520,
    alignSelf: "center",
  },
  button: {
    height: 54,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: INK,
    borderRadius: 16,
  },
  leave: {
    width: 130,
    backgroundColor: GAME_COLORS.paper,
    boxShadow: `0px 5px 0px ${INK}`,
  },
  leaveText: {
    fontFamily: FONTS.display,
    fontSize: 18,
    color: GAME_COLORS.heading,
  },
  rematch: {
    flex: 1,
    backgroundColor: GAME_COLORS.go,
    boxShadow: `0px 5px 0px ${INK}, inset 0px 5px 0px rgba(255, 255, 255, 0.28), inset 0px -5px 0px rgba(7, 60, 29, 0.35)`,
  },
  rematchText: {
    fontFamily: FONTS.display,
    fontSize: 20,
    color: "#FFFFFF",
    textShadowColor: INK,
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 1,
  },
});
