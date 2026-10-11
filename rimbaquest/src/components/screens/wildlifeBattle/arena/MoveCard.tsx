import React from "react";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Image, ImageStyle, StyleSheet, Text, View } from "react-native";
import { BATTLE_IMAGES } from "../../../../constants/images";
import { FONTS } from "../../../../constants/fonts";
import { GAME_COLORS } from "../../../common/game/gameTheme";
import { Tap } from "../../../common/Tap";
import { WildlifeAbility, WildlifeAction } from "../../../../types/wildlifeMatch";
import { effectLine } from "../../collection/components/detail/AbilityStats";

const INK = GAME_COLORS.ink;

export type BattleMove = {
  action: WildlifeAction;
  name: string;
  cost: number;
  description: string;
  effects: WildlifeAbility["effects"];
  habitatBonusDamage: number;
  unlocked: boolean;
  enabled: boolean;
  note: string;
};

export function MoveCard({
  move,
  onPress,
  disabled,
  tall = false,
}: {
  move: BattleMove;
  onPress: () => void;
  disabled: boolean;
  tall?: boolean;
}) {
  const stats = (move.effects ?? []).flatMap((effect) => {
    const line = effectLine(effect);
    if (!line) return [];
    const boosted = effect.type === "damage" && move.habitatBonusDamage > 0;
    return [{
      ...line,
      boosted,
      value: boosted ? `${effect.value + move.habitatBonusDamage}` : line.value,
      text: boosted
        ? `Deal ${effect.value} damage plus ${move.habitatBonusDamage} habitat damage, ${effect.value + move.habitatBonusDamage} total`
        : line.text,
    }];
  });
  const statsLabel = stats.length
    ? ` ${stats.map((stat) => stat.text).join(", ")}.`
    : "";
  const moveStats = stats.length ? (
    <View style={styles.stats}>
      {stats.map((stat, index) => (
        <View key={`${stat.text}-${index}`} style={[styles.stat, stat.boosted && styles.statBoosted]}>
          <Image source={stat.icon} style={styles.statIcon} resizeMode="contain" />
          <Text style={[styles.statText, !move.unlocked && styles.statTextLocked, stat.boosted && styles.statTextBoosted]}>
            {stat.value} {stat.label}
          </Text>
          {stat.boosted ? (
            <MaterialCommunityIcons name="chevron-double-up" size={14} color={GAME_COLORS.goldText} />
          ) : null}
        </View>
      ))}
    </View>
  ) : null;
  if (!move.unlocked) {
    return (
      <Tap
        label={`${move.name}, ${move.cost} Energy.${statsLabel} Locked, pass its quiz to unlock.`}
        onPress={onPress}
        disabled
        style={[
          styles.moveCard,
          tall && styles.moveCardTall,
          styles.moveCardLocked,
        ]}
      >
        <View style={styles.moveHeader}>
          <Text
            style={[styles.moveName, styles.moveNameLocked]}
            numberOfLines={1}
          >
            {move.name}
          </Text>
          <Image
            source={BATTLE_IMAGES.lock}
            style={styles.lockIcon as ImageStyle}
            resizeMode="contain"
          />
        </View>
        {moveStats}
        {/* <Text
          style={[styles.moveNote, styles.moveNoteLocked]}
          numberOfLines={1}
        >
          Pass its quiz to unlock
        </Text> */}
      </Tap>
    );
  }
  const enabled = move.enabled && !disabled;
  // The basic attack is free and always ready.
  if (tall) {
    return (
      <Tap
        label={`Attack.${statsLabel}`}
        onPress={onPress}
        disabled={!enabled}
        style={[
          styles.moveCard,
          styles.moveCardTall,
          !enabled && styles.moveCardInactive,
        ]}
      >
        <Text style={[styles.moveName, styles.moveNameTall]}>Attack</Text>
        {moveStats}
      </Tap>
    );
  }
  // A short reason ("Not enough Energy") replaces the description when the move can't be used.
  const blocked = move.note !== move.description;
  return (
    <Tap
      label={`${move.name}, ${move.cost} Energy.${statsLabel} ${blocked ? move.note : ""}`}
      onPress={onPress}
      disabled={!enabled}
      style={[styles.moveCard, !enabled && styles.moveCardInactive]}
    >
      <View style={styles.moveHeader}>
        <Text style={styles.moveName} numberOfLines={1}>
          {move.name}
        </Text>
        <View style={styles.costPill}>
          <Image
            source={BATTLE_IMAGES.energy}
            style={styles.costIcon as ImageStyle}
          />
          <Text style={styles.costText}>{move.cost}</Text>
        </View>
      </View>
      {moveStats}
      {blocked || !stats.length ? (
        <Text
          style={[styles.moveDescription, blocked && styles.moveNote]}
          numberOfLines={1}
        >
          {blocked ? move.note : move.description}
        </Text>
      ) : null}
    </Tap>
  );
}

const styles = StyleSheet.create({
  moveCard: {
    minHeight: 52,
    gap: 2,
    justifyContent: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: GAME_COLORS.paper,
    borderWidth: 3,
    borderColor: INK,
    borderRadius: 16,
    boxShadow: `0px 5px 0px ${INK}, inset 0px 5px 0px rgba(255, 255, 255, 0.5)`,
  },
  moveCardTall: { flex: 1, alignItems: "center" },
  moveCardInactive: { opacity: 0.55 },
  moveCardLocked: {
    backgroundColor: GAME_COLORS.track,
    borderColor: "#6F6A55",
    boxShadow: "0px 4px 0px #6F6A55",
  },
  moveHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 6,
  },
  moveName: {
    flexShrink: 1,
    fontFamily: FONTS.display,
    fontSize: 16,
    color: GAME_COLORS.heading,
  },
  moveNameTall: { fontSize: 26, textAlign: "center" },
  moveNameLocked: { fontSize: 16, color: "#4E4A3A" },
  stats: { flexDirection: "row", flexWrap: "wrap", justifyContent: "flex-start", columnGap: 6, rowGap: 2 },
  stat: { flexDirection: "row", alignItems: "center", gap: 2 },
  statBoosted: { paddingHorizontal: 4, paddingVertical: 2, backgroundColor: GAME_COLORS.goldLight, borderRadius: 6 },
  statIcon: { width: 12, height: 12 },
  statText: { fontFamily: FONTS.bodyBold, fontSize: 10, lineHeight: 12, color: GAME_COLORS.body },
  statTextLocked: { color: "#6F6A55" },
  statTextBoosted: { color: GAME_COLORS.goldText },
  costPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    backgroundColor: "#FFE7A8",
    borderWidth: 2,
    borderColor: INK,
    borderRadius: 999,
    paddingLeft: 3,
    paddingRight: 8,
  },
  costIcon: { width: 16, height: 20.27 },
  costText: { fontFamily: FONTS.display, fontSize: 15, color: "#7A3500" },
  moveDescription: {
    fontFamily: FONTS.bodyBold,
    fontSize: 11.5,
    lineHeight: 15,
    color: GAME_COLORS.body,
  },
  moveNote: { fontFamily: FONTS.bodyBlack, fontSize: 10.5, color: "#7A3500" },
  moveNoteLocked: { color: "#6F6A55" },
  lockIcon: { width: 18, height: 21 },
});
