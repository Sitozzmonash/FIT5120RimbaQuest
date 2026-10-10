import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { FONTS } from "../../../../constants/fonts";
import { GAME_COLORS } from "../../../common/game/gameTheme";
import type { WildlifeHabitatBonus } from "../../../../types/wildlifeMatch";
import { outlined } from "./arenaText";

const INK = GAME_COLORS.ink;

export function HabitatSign({ habitat, bonus }: { habitat: string; bonus?: WildlifeHabitatBonus | null }) {
  return (
    <View style={styles.sign}>
      <View style={styles.tag}>
        <Text style={styles.tagText}>HABITAT</Text>
      </View>
      <View style={styles.board}>
        <Text style={styles.title}>{habitat}</Text>
        {bonus ? (
          <Text style={styles.bonusInfo}>
            Animals living here get BOOST: +{bonus.attack_percent}% ATK, +{bonus.defence_percent}% DEF.
          </Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  sign: { alignSelf: "stretch", alignItems: "center" },
  tag: {
    zIndex: 2,
    marginBottom: -6,
    backgroundColor: "rgba(255, 255, 255, 0.88)",
    borderWidth: 2,
    borderColor: INK,
    borderRadius: 999,
    paddingHorizontal: 10,
  },
  tagText: {
    fontFamily: FONTS.bodyBlack,
    fontSize: 10,
    letterSpacing: 2,
    color: GAME_COLORS.heading,
  },
  board: {
    alignItems: "center",
    maxWidth: "100%",
    backgroundColor: "#2F7A3D",
    borderWidth: 3,
    borderColor: INK,
    borderRadius: 14,
    paddingTop: 9,
    paddingBottom: 6,
    paddingHorizontal: 14,
    boxShadow: `0px 4px 0px ${INK}`,
  },
  title: {
    fontFamily: FONTS.display,
    fontSize: 21,
    color: "#FFFFFF",
    textAlign: "center",
    ...outlined(INK),
  },
  bonusInfo: {
    fontFamily: FONTS.bodyBlack,
    fontSize: 10.5,
    lineHeight: 14,
    color: GAME_COLORS.woodText,
    textAlign: "center",
  },
});
