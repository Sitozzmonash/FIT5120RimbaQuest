import React from "react";
import { Image, StyleSheet, Text, View } from "react-native";
import { BATTLE_IMAGES } from "../../../../constants/images";
import { FONTS } from "../../../../constants/fonts";
import { GAME_COLORS } from "../../../common/game/gameTheme";

const INK = GAME_COLORS.ink;

function PointsTile({
  friend,
  delta,
  rankLine,
}: {
  friend: boolean;
  delta: number | null | undefined;
  rankLine: string;
}) {
  if (!friend) {
    return (
      <View style={styles.tile}>
        <Text style={styles.kicker}>PRACTICE</Text>
        <Text style={[styles.value, styles.valueSmall]}>No points</Text>
        <Text style={styles.note}>Bot battles don't count</Text>
      </View>
    );
  }
  const known = typeof delta === "number";
  return (
    <View style={styles.tile}>
      <Text style={styles.kicker}>LEADERBOARD</Text>
      <Text
        style={[
          styles.value,
          { color: known && delta < 0 ? "#C7353A" : GAME_COLORS.go },
        ]}
      >
        {known
          ? `${delta > 0 ? "+" : delta < 0 ? "−" : ""}${Math.abs(delta)} pts`
          : "…"}
      </Text>
      <Text style={styles.note}>{rankLine}</Text>
    </View>
  );
}

function RestTile({ cardName }: { cardName: string }) {
  return (
    <View style={[styles.tile, styles.restTile]}>
      <Text style={[styles.kicker, styles.restText]}>CARD REST</Text>
      <View style={styles.restRow}>
        <Image source={BATTLE_IMAGES.clock} style={{ width: 18, height: 20 }} resizeMode="contain" />
        <Text style={[styles.value, styles.valueSmall, styles.restValue]}>
          2 hours
        </Text>
      </View>
      <Text style={[styles.note, styles.restText]} numberOfLines={1}>
        {cardName} rests
      </Text>
    </View>
  );
}

export function ResultTiles({
  friend,
  delta,
  rankLine,
  cardName,
}: {
  friend: boolean;
  delta: number | null | undefined;
  /** "#1 → #2", or the current rank. */
  rankLine: string;
  cardName: string;
}) {
  return (
    <View style={styles.row}>
      <PointsTile friend={friend} delta={delta} rankLine={rankLine} />
      <RestTile cardName={cardName} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", gap: 10 },
  tile: {
    flex: 1,
    gap: 2,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: GAME_COLORS.paper,
    borderWidth: 3,
    borderColor: INK,
    borderRadius: 16,
    boxShadow: `0px 4px 0px ${INK}`,
  },
  restTile: {
    backgroundColor: "#ECE2C8",
    borderColor: "#A89D7C",
    boxShadow: "0px 4px 0px #A89D7C",
  },
  kicker: {
    fontFamily: FONTS.bodyBlack,
    fontSize: 10,
    letterSpacing: 1.5,
    color: GAME_COLORS.label,
  },
  value: {
    fontFamily: FONTS.display,
    fontSize: 26,
    lineHeight: 28,
    color: GAME_COLORS.heading,
  },
  valueSmall: { fontSize: 20, lineHeight: 24 },
  note: {
    fontFamily: FONTS.bodyExtraBold,
    fontSize: 11.5,
    color: GAME_COLORS.label,
  },
  restRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  restValue: { color: "#4E4A3A" },
  restText: { color: "#6F6A55" },
});
