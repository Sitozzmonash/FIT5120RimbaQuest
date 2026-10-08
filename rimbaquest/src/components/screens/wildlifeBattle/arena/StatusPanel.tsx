// Health bar, Energy segments and habitat bonus for one side of the battle.
import React from "react";
import { Image, ImageStyle, StyleSheet, Text, View } from "react-native";
import { BATTLE_IMAGES } from "../../../../constants/images";
import { FONTS } from "../../../../constants/fonts";
import { GAME_COLORS } from "../../../common/game/gameTheme";
import { WildlifeCombatant } from "../../../../types/wildlifeMatch";
import { Tag } from "./Tag";

const INK = GAME_COLORS.ink;

function habitatBonusLabel(habitat: string): string {
  return `${habitat === "Rainforest" ? "Forest" : habitat} bonus +20%`;
}

export function StatusPanel({
  combatant,
  tag,
  tagColor,
  habitat,
}: {
  combatant: WildlifeCombatant;
  tag: string;
  tagColor: string;
  habitat: string;
}) {
  const hpPercent =
    combatant.max_hp > 0
      ? Math.max(0, Math.min(100, (combatant.hp / combatant.max_hp) * 100))
      : 0;
  const segments = Array.from(
    { length: combatant.max_energy },
    (_, index) => index < combatant.energy,
  );
  return (
    <View style={styles.statusPanel}>
      <View style={styles.statusHeader}>
        <Tag label={tag} color={tagColor} light />
        <Text style={styles.statusName} numberOfLines={1}>
          {combatant.name}
        </Text>
      </View>
      <View style={styles.statusRow}>
        <Image
          source={BATTLE_IMAGES.health}
          style={styles.healthIcon as ImageStyle}
          resizeMode="contain"
        />
        <View
          style={styles.barTrack}
          accessibilityRole="progressbar"
          accessibilityLabel={`${combatant.name} health`}
          accessibilityValue={{
            min: 0,
            max: combatant.max_hp,
            now: combatant.hp,
          }}
        >
          {hpPercent > 0 ? (
            <View style={[styles.healthFill, { width: `${hpPercent}%` }]} />
          ) : null}
        </View>
        <Text style={styles.statusValue}>
          {combatant.hp}/{combatant.max_hp}
        </Text>
      </View>
      <View style={styles.statusRow}>
        <Image
          source={BATTLE_IMAGES.energy}
          style={styles.energyIcon as ImageStyle}
          resizeMode="contain"
        />
        <View
          style={[styles.barTrack, styles.energyTrack]}
          accessibilityRole="progressbar"
          accessibilityLabel={`${combatant.name} energy`}
          accessibilityValue={{
            min: 0,
            max: combatant.max_energy,
            now: combatant.energy,
          }}
        >
          {segments.map((filled, index) => (
            <View
              key={index}
              style={[
                styles.energySegment,
                filled && styles.energySegmentFilled,
                index === segments.length - 1 && styles.energySegmentLast,
              ]}
            />
          ))}
        </View>
        <Text style={[styles.statusValue, styles.energyValue]}>
          {combatant.energy}/{combatant.max_energy}
        </Text>
      </View>
      <View style={styles.statusFooter}>
        {combatant.habitat_advantage ? (
          <View style={styles.bonusPill}>
            <Image
              source={BATTLE_IMAGES.habitatBonus}
              style={styles.bonusIcon as ImageStyle}
              resizeMode="contain"
            />
            <Text style={styles.bonusText}>{habitatBonusLabel(habitat)}</Text>
          </View>
        ) : (
          <Text style={styles.noBonusText}>No habitat bonus</Text>
        )}
        {combatant.shield ? (
          <Text style={styles.shieldText}>Shield {combatant.shield}</Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  statusPanel: {
    flex: 1,
    gap: 7,
    paddingTop: 8,
    paddingBottom: 10,
    paddingHorizontal: 10,
    backgroundColor: "rgba(7, 40, 22, 0.86)",
    borderWidth: 3,
    borderColor: INK,
    borderRadius: 16,
    boxShadow: "0px 4px 0px rgba(7, 60, 29, 0.6)",
  },
  statusHeader: { flexDirection: "row", alignItems: "center", gap: 6 },
  statusName: {
    flexShrink: 1,
    fontFamily: FONTS.display,
    fontSize: 13,
    lineHeight: 14,
    color: GAME_COLORS.woodText,
  },
  statusRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  healthIcon: { width: 16, height: 14 },
  energyIcon: { width: 16, height: 20 },
  barTrack: {
    flex: 1,
    height: 14,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    borderWidth: 2,
    borderColor: INK,
    borderRadius: 999,
    overflow: "hidden",
  },
  healthFill: {
    height: "100%",
    backgroundColor: "#4CB35A",
    boxShadow: "inset 0px 3px 0px rgba(255, 255, 255, 0.35)",
  },
  energyTrack: { flexDirection: "row" },
  energySegment: {
    flex: 1,
    height: "100%",
    borderRightWidth: 2,
    borderRightColor: INK,
  },
  energySegmentFilled: { backgroundColor: GAME_COLORS.goldLight },
  energySegmentLast: { borderRightWidth: 0 },
  statusValue: {
    minWidth: 44,
    fontFamily: FONTS.display,
    fontSize: 13,
    color: "#FFFFFF",
    textAlign: "right",
  },
  energyValue: { color: GAME_COLORS.goldLight },
  statusFooter: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 6,
  },
  bonusPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: GAME_COLORS.goldLight,
    borderWidth: 2,
    borderColor: INK,
    borderRadius: 999,
    paddingLeft: 4,
    paddingRight: 8,
    paddingVertical: 1,
  },
  bonusIcon: { width: 13, height: 12 },
  bonusText: {
    fontFamily: FONTS.bodyBlack,
    fontSize: 10.5,
    color: GAME_COLORS.goldText,
  },
  noBonusText: {
    fontFamily: FONTS.bodyExtraBold,
    fontSize: 10.5,
    color: "rgba(255, 246, 220, 0.6)",
    paddingVertical: 2,
  },
  shieldText: { fontFamily: FONTS.bodyBlack, fontSize: 10.5, color: "#6FC3E8" },
});
