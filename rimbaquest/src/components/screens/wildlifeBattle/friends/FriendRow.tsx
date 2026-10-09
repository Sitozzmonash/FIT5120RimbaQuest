import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { FONTS } from "../../../../constants/fonts";
import { GAME_COLORS } from "../../../common/game/gameTheme";
import { ScaleTap } from "../../../common/ScaleTap";
import { WildlifeFriend } from "../../../../types/wildlifeMatch";
import { Avatar } from "../shared/Avatar";

const INK = GAME_COLORS.ink;

export function FriendRow({
  friend,
  rank,
  busy,
  onBattle,
}: {
  friend: WildlifeFriend;
  rank: number | undefined;
  busy: boolean;
  onBattle: () => void;
}) {
  return (
    <View style={styles.row}>
      <Avatar avatar={friend.avatar} size={44} />
      <View style={styles.flex}>
        <Text style={styles.name} numberOfLines={1}>
          {friend.display_name}
        </Text>
        <Text style={styles.meta}>
          {friend.points} pts{rank ? ` · #${rank} on your board` : ""}
        </Text>
      </View>
      <ScaleTap
        label={`Battle ${friend.display_name}`}
        onPress={onBattle}
        disabled={busy}
        style={[styles.battleButton, busy && styles.disabled]}
      >
        <Text style={styles.battleText}>Battle!</Text>
      </ScaleTap>
    </View>
  );
}

const styles = StyleSheet.create({
  disabled: { opacity: 0.45 },
  flex: { flex: 1 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 8,
    paddingHorizontal: 10,
    backgroundColor: "#FFFFFF",
    borderWidth: 3,
    borderColor: INK,
    borderRadius: 16,
  },
  name: {
    fontFamily: FONTS.bodyBlack,
    fontSize: 15,
    color: GAME_COLORS.heading,
  },
  meta: { fontFamily: FONTS.bodyBold, fontSize: 12, color: GAME_COLORS.label },
  battleButton: {
    height: 38,
    paddingHorizontal: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFB938",
    borderWidth: 3,
    borderColor: INK,
    borderRadius: 999,
    boxShadow: `0px 4px 0px ${INK}, inset 0px 4px 0px rgba(255, 255, 255, 0.4)`,
  },
  battleText: {
    fontFamily: FONTS.display,
    fontSize: 15,
    color: "#FFFFFF",
    textShadowColor: "#7A3500",
    textShadowOffset: { width: 1, height: 2 },
    textShadowRadius: 1,
  },
});
