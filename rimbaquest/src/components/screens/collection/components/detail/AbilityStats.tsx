import React from "react";
import { Image, StyleSheet, Text, View } from "react-native";
import { BATTLE_IMAGES } from "../../../../../constants/images";
import { FONTS } from "../../../../../constants/fonts";
import type { SpeciesAbility } from "../../speciesAbilities";
import { DETAIL_COLORS, DETAIL_IMAGES } from "./detailTheme";

type Effect = NonNullable<SpeciesAbility["effects"]>[number];

export function effectLine(effect: Effect) {
  switch (effect.type) {
    case "damage":
      return { text: `Deal ${effect.value} damage`, icon: DETAIL_IMAGES.swords, value: `${effect.value}`, label: "Damage", color: "#C7353A" };
    case "heal_hp":
      return { text: `+${effect.value} HP restored`, icon: DETAIL_IMAGES.heart, value: `+${effect.value}`, label: "HP restored", color: DETAIL_COLORS.badgeGreen };
    case "shield":
      return { text: `+${effect.value} Shield`, icon: BATTLE_IMAGES.leafShield, value: `+${effect.value}`, label: "Shield", color: DETAIL_COLORS.badgeGreen };
    case "guard":
      return { text: `${effect.value}% less damage from the next hit`, icon: BATTLE_IMAGES.leafShield, value: `${effect.value}%`, label: "Less next hit", color: "#7A3500" };
    case "block":
      return { text: `Block ${effect.value} damage from the next hit`, icon: BATTLE_IMAGES.leafShield, value: `${effect.value}`, label: "Damage blocked", color: "#7A3500" };
    case "boost":
      return { text: `+${effect.value} damage on the next attack`, icon: DETAIL_IMAGES.swords, value: `+${effect.value}`, label: "Next attack", color: "#C7353A" };
    case "weaken":
      return { text: `-${effect.value} damage on the opponent's next attack`, icon: DETAIL_IMAGES.swords, value: `-${effect.value}`, label: "Foe's next hit", color: "#7A3500" };
    default:
      return null;
  }
}

export function AbilityStats({ effects }: { effects?: SpeciesAbility["effects"] }) {
  const lines = (effects ?? []).map(effectLine).filter((line) => line !== null);
  if (!lines.length) return null;

  return (
    <View style={styles.cards}>
      {lines.map((line, index) => (
        <View key={`${line.text}-${index}`} style={styles.card}>
          <Image source={line.icon} style={styles.icon} resizeMode="contain" />
          <Text style={[styles.value, { color: line.color }]}>{line.value}</Text>
          <Text style={styles.label}>{line.label}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  cards: { alignSelf: "stretch", flexDirection: "row", flexWrap: "wrap", gap: 8, paddingVertical: 4 },
  card: {
    flexBasis: "45%",
    flexGrow: 1,
    minWidth: 0,
    alignItems: "center",
    gap: 2,
    paddingHorizontal: 6,
    paddingTop: 10,
    paddingBottom: 8,
    backgroundColor: "#FFFFFF",
    borderWidth: 3,
    borderColor: DETAIL_COLORS.ink,
    borderRadius: 16,
  },
  icon: { width: 30, height: 30 },
  value: { fontFamily: FONTS.display, fontSize: 26, lineHeight: 28, textAlign: "center" },
  label: {
    fontFamily: FONTS.bodyBlack,
    fontSize: 10.5,
    lineHeight: 13,
    color: DETAIL_COLORS.label,
    textTransform: "uppercase",
    textAlign: "center",
  },
});
