import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { FONTS } from "../../../../constants/fonts";
import { GAME_COLORS } from "../../../common/game/gameTheme";
import { outlined } from "./arenaText";

const INK = GAME_COLORS.ink;

// Backend habitats are single words; the sign reads like the design.
function habitatTitle(habitat: string): string {
  return habitat === "Rainforest" ? "Rainforest & Forest" : habitat;
}

export function HabitatSign({ habitat }: { habitat: string }) {
  return (
    <View style={styles.sign}>
      <View style={styles.tag}>
        <Text style={styles.tagText}>HABITAT</Text>
      </View>
      <View style={styles.board}>
        <Text style={styles.title}>{habitatTitle(habitat)}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  sign: { alignSelf: "center", alignItems: "center" },
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
    ...outlined(INK),
  },
});
