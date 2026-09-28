import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { FONTS } from "../../../../../constants/fonts";
import { DETAIL_COLORS } from "./detailTheme";

const TONES = {
  green: {
    bg: DETAIL_COLORS.badgeGreen,
    border: DETAIL_COLORS.ink,
    text: DETAIL_COLORS.paper,
  },
  mint: {
    bg: DETAIL_COLORS.mint,
    border: DETAIL_COLORS.mintBorder,
    text: DETAIL_COLORS.mintText,
  },
  amber: { bg: "#FFE7A8", border: "#C25E00", text: "#7A3500" },
  red: { bg: "#FFD3BD", border: "#C7353A", text: "#8A1F24" },
};

export function DetailPill({
  label,
  tone = "mint",
}: {
  label: string;
  tone?: keyof typeof TONES;
}) {
  const t = TONES[tone];
  return (
    <View
      style={[styles.pill, { backgroundColor: t.bg, borderColor: t.border }]}
    >
      <Text style={[styles.text, { color: t.text }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderWidth: 2,
    borderRadius: 999,
  },
  text: { fontFamily: FONTS.bodyBlack, fontSize: 12 },
});
