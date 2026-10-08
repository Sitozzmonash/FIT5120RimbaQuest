import React, { useEffect } from "react";
import { Image, ImageStyle, StyleSheet, Text, View } from "react-native";
import { BATTLE_IMAGES } from "../../../../constants/images";
import { FONTS } from "../../../../constants/fonts";
import { GAME_COLORS } from "../../../common/game/gameTheme";
import { useAbilityQuizStore } from "../../../../store/useAbilityQuizStore";
import { Species } from "../../../../types";
import { speciesAbilities } from "../../collection/speciesAbilities";

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
}: {
  name: string;
  cost: number;
  locked: boolean;
}) {
  return (
    <View
      style={[styles.row, locked && styles.rowLocked]}
      accessible
      accessibilityLabel={`${name}, ${cost} Energy${locked ? ". Locked, pass its quiz to unlock" : ""}`}
    >
      <Text
        style={[styles.name, locked && styles.nameLocked]}
        numberOfLines={1}
      >
        {name}
      </Text>
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
  const skills = [
    { slot: 0, name: "Basic Attack" },
    ...speciesAbilities(species),
  ];
  const isLocked = (slot: number) =>
    slot > 0 && Boolean(unlockedSlots) && !unlockedSlots!.includes(slot);
  return (
    <View style={styles.list}>
      {skills.map((skill) => (
        <SkillRow
          key={skill.slot}
          name={skill.name}
          cost={SKILL_COSTS[skill.slot]}
          locked={isLocked(skill.slot)}
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
