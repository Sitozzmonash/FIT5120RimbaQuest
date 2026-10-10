// Health bar, Energy segments and habitat bonus for one side of the battle.
import React from "react";
import { Image, ImageStyle, StyleSheet, Text, View } from "react-native";
import { BATTLE_IMAGES } from "../../../../constants/images";
import { FONTS } from "../../../../constants/fonts";
import { GAME_COLORS } from "../../../common/game/gameTheme";
import { WildlifeCombatant } from "../../../../types/wildlifeMatch";
import { Tag } from "./Tag";

const INK = GAME_COLORS.ink;

export function StatusPanel({
  combatant,
  tag,
  tagColor,
}: {
  combatant: WildlifeCombatant;
  tag: string;
  tagColor: string;
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
        {combatant.habitat_advantage ? (
          <View style={styles.boostBadge}>
            <Text style={styles.boostText}>BOOST</Text>
          </View>
        ) : null}
        {/* <Text style={styles.statusName} numberOfLines={1}>
          {combatant.name}
        </Text> */}
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
      <View style={styles.statusRow}>
        <Image
          source={BATTLE_IMAGES.leafShield}
          style={styles.shieldIcon as ImageStyle}
          resizeMode="contain"
        />
        <Text style={styles.shieldLabel}>Shield</Text>
        <Text style={[styles.statusValue, styles.shieldValue]}>
          {combatant.shield ?? 0}
        </Text>
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
  boostBadge: {
    backgroundColor: GAME_COLORS.goldLight,
    borderWidth: 2,
    borderColor: "#FFFFFF",
    borderRadius: 999,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  boostText: { fontFamily: FONTS.bodyBlack, fontSize: 9.5, color: GAME_COLORS.goldText },
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
  shieldIcon: { width: 16, height: 16 },
  shieldLabel: { flex: 1, fontFamily: FONTS.bodyBlack, fontSize: 11, color: "#6FC3E8" },
  shieldValue: { color: "#6FC3E8" },
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
});
