import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { FONTS } from "../../../../constants/fonts";
import { GAME_COLORS } from "../../../common/game/gameTheme";

const INK = GAME_COLORS.ink;

export type ChipTone = "win" | "loss" | "plain" | "gold" | "habitat" | "expiry";

export function Chip({ text, tone }: { text: string; tone: ChipTone }) {
  return (
    <View style={[styles.chip, styles[tone]]}>
      <Text style={[styles.text, TEXT[tone]]}>{text}</Text>
    </View>
  );
}

const TEXT: Record<ChipTone, { color: string }> = {
  win: { color: "#FFFFFF" },
  loss: { color: "#FFFFFF" },
  plain: { color: GAME_COLORS.body },
  gold: { color: GAME_COLORS.goldText },
  habitat: { color: "#1A4D2B" },
  expiry: { color: "#7A3500" },
};

const styles = StyleSheet.create({
  chip: {
    alignSelf: "flex-start",
    borderWidth: 2,
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 1,
  },
  text: { fontFamily: FONTS.bodyBlack, fontSize: 11 },
  win: { backgroundColor: "#1F6B33", borderColor: INK },
  loss: { backgroundColor: "#C7353A", borderColor: INK },
  plain: { backgroundColor: GAME_COLORS.paper, borderColor: "#6B7A67" },
  gold: { backgroundColor: GAME_COLORS.goldLight, borderColor: INK },
  habitat: { backgroundColor: "#D8ECCE", borderColor: "#2F7A41" },
  expiry: { backgroundColor: "#FFE7A8", borderColor: "#C25E00" },
});
