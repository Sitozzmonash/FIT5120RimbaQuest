import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { FONTS } from "../../../../constants/fonts";
import { GAME_COLORS } from "../../../common/game/gameTheme";
import { WildlifeLeaderboardEntry } from "../../../../types/wildlifeMatch";
import { Avatar } from "./Avatar";

const INK = GAME_COLORS.ink;

export function formatPoints(points: number): string {
  return `${points < 0 ? `−${Math.abs(points)}` : points} pts`;
}

export function LeaderboardRow({
  entry,
  mine,
  avatar,
  paper = false,
}: {
  entry: WildlifeLeaderboardEntry;
  mine: boolean;
  avatar: string | undefined;
  paper?: boolean;
}) {
  return (
    <View style={[styles.row, paper && styles.paper, mine && styles.mine]}>
      <Text style={styles.rank}>{entry.rank}</Text>
      <Avatar avatar={avatar} size={40} />
      <Text style={styles.name} numberOfLines={1}>
        {entry.display_name}
        {mine ? " (you)" : ""}
      </Text>
      <Text style={[styles.points, entry.points < 0 && styles.negative]}>
        {formatPoints(entry.points)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: "#FFFFFF",
    borderWidth: 3,
    borderColor: INK,
    borderRadius: 14,
  },
  paper: { backgroundColor: GAME_COLORS.paper },
  mine: {
    backgroundColor: GAME_COLORS.goldLight,
    boxShadow: `0px 4px 0px ${INK}`,
  },
  rank: {
    width: 24,
    fontFamily: FONTS.display,
    fontSize: 18,
    color: GAME_COLORS.label,
    textAlign: "center",
  },
  name: {
    flex: 1,
    fontFamily: FONTS.bodyBlack,
    fontSize: 15,
    color: GAME_COLORS.heading,
  },
  points: { fontFamily: FONTS.display, fontSize: 16, color: "#1F6B33" },
  negative: { color: "#C7353A" },
});
