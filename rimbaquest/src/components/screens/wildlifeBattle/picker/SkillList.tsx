import React, { useEffect } from "react";
import { Image, ImageStyle, StyleSheet, Text, View } from "react-native";
import { BATTLE_IMAGES } from "../../../../constants/images";
import { FONTS } from "../../../../constants/fonts";
import { GAME_COLORS } from "../../../common/game/gameTheme";
import { useAbilityQuizStore } from "../../../../store/useAbilityQuizStore";
import { Species } from "../../../../types";
import { speciesAbilities } from "../../collection/speciesAbilities";
import type { SpeciesAbility } from "../../collection/speciesAbilities";
import { effectLine } from "../../collection/components/detail/AbilityStats";

const INK = GAME_COLORS.ink;
const SKILL_COSTS = [0, 1, 2, 4];

function useUnlockedSlots(speciesId: string): number[] | undefined {
  const unlocked = useAbilityQuizStore(
    (state) => state.progressionBySpecies[speciesId],
  );
  useEffect(() => {
    const store = useAbilityQuizStore.getState();
    if (!(speciesId in store.progressionBySpecies))
      void store.fetchProgression(speciesId);
  }, [speciesId]);
  return unlocked;
}

function SkillRow({
  name,
  cost,
  locked,
  effects,
}: {
  name: string;
  cost: number;
  locked: boolean;
  effects?: SpeciesAbility["effects"];
}) {
  const stats = (effects ?? []).map(effectLine).filter((line) => line !== null);
  return (
    <View
      style={[styles.row, locked && styles.rowLocked]}
      accessible
      accessibilityLabel={`${name}, ${cost} Energy${stats.length ? `. ${stats.map((stat) => stat.text).join(", ")}` : ""}${locked ? ". Locked, pass its quiz to unlock" : ""}`}
    >
      <View style={styles.skillDetails}>
        <Text style={[styles.name, locked && styles.nameLocked]} numberOfLines={1}>
          {name}
        </Text>
        {stats.map((stat, index) => (
          <View key={`${stat.text}-${index}`} style={styles.statRow}>
            <Image source={stat.icon} style={styles.statIcon} resizeMode="contain" />
            <Text style={[styles.statText, locked && styles.statTextLocked]}>{stat.text}</Text>
          </View>
        ))}
      </View>
      {locked ? (
        <View style={[styles.pill, styles.pillLocked]}>
          <Image
            source={BATTLE_IMAGES.lock}
            style={styles.lockIcon as ImageStyle}
            resizeMode="contain"
          />
          <Text style={[styles.pillText, styles.pillTextLocked]}>Locked</Text>
        </View>
      ) : (
        <View style={styles.pill}>
          <Image
            source={BATTLE_IMAGES.zap}
            style={styles.zapIcon as ImageStyle}
            resizeMode="contain"
          />
          <Text style={styles.pillText}>{cost}</Text>
        </View>
      )}
    </View>
  );
}

export function SkillList({ species }: { species: Species }) {
  const unlockedSlots = useUnlockedSlots(species.id);
  const skills = speciesAbilities(species);
  const isLocked = (slot: number) =>
    Boolean(unlockedSlots) && !unlockedSlots!.includes(slot);
  return (
    <View style={styles.list}>
      {skills.map((skill) => (
        <SkillRow
          key={skill.slot}
          name={skill.name}
          cost={SKILL_COSTS[skill.slot]}
          locked={isLocked(skill.slot)}
          effects={skill.effects}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  list: { gap: 8 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "#FFFFFF",
    borderWidth: 2,
    borderColor: INK,
    borderRadius: 12,
  },
  rowLocked: { backgroundColor: GAME_COLORS.track, borderColor: "#6F6A55" },
  skillDetails: { flex: 1, gap: 3 },
  statRow: { flexDirection: "row", alignItems: "flex-start", gap: 5 },
  statIcon: { width: 13, height: 13 },
  statText: {
    flex: 1,
    fontFamily: FONTS.bodyBold,
    fontSize: 11,
    lineHeight: 14,
    color: GAME_COLORS.body,
  },
  statTextLocked: { color: "#6F6A55" },
  name: {
    flexShrink: 1,
    fontFamily: FONTS.button,
    fontSize: 14,
    color: GAME_COLORS.headerGreen,
  },
  nameLocked: { color: "#4E4A3A" },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#FFF9E6",
    borderWidth: 1,
    borderColor: INK,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  pillLocked: { backgroundColor: "#E4DCC6", borderColor: "#8C8570" },
  zapIcon: { width: 12, height: 12 },
  lockIcon: { width: 12, height: 14 },
  pillText: { fontFamily: FONTS.button, fontSize: 12, color: "#5A2D0A" },
  pillTextLocked: { color: "#8C8570" },
});
