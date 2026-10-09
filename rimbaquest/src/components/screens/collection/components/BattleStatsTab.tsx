import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { FONTS } from "../../../../constants/fonts";
import { useAbilityQuizStore } from "../../../../store/useAbilityQuizStore";
import { Species } from "../../../../types";
import { speciesAbilities } from "../speciesAbilities";
import { AbilityRow } from "./detail/AbilityRow";
import { DetailCard } from "./detail/DetailCard";
import { DETAIL_COLORS, DETAIL_IMAGES } from "./detail/detailTheme";
import { StatTile } from "./detail/StatTile";
import { TabStatus } from "./detail/TabStatus";

const EMPTY_ABILITIES: number[] = [];

export function BattleStatsTab({ item }: { item: Species }) {
  const unlockedAbilities = useAbilityQuizStore(
    (state) => state.progressionBySpecies[item.id] ?? EMPTY_ABILITIES,
  );
  const isProgressionKnown = useAbilityQuizStore(
    (state) => item.id in state.progressionBySpecies,
  );

  return (
    <DetailCard>
      <Text style={styles.heading}>Card Combat Attributes</Text>
      <View style={styles.stats}>
        <StatTile
          label="HP"
          value={item.hp ?? item.max_energy ?? "—"}
          icon={DETAIL_IMAGES.heart}
          iconSize={{ width: 30, height: 25.16 }}
          color="#C7353A"
        />
        <StatTile
          label="DAMAGE"
          value={item.base_attack ?? "—"}
          icon={DETAIL_IMAGES.swords}
          iconSize={{ width: 30, height: 27.24 }}
          color="#B85200"
        />
      </View>

      <Text style={[styles.heading, styles.spaced]}>Special Abilities</Text>
      {!isProgressionKnown ? (
        <TabStatus loading message="Checking your ability progress…" />
      ) : (
        speciesAbilities(item).map(({ slot, name, description }) => {
          const isUnlocked = unlockedAbilities.includes(slot);
          return (
            <AbilityRow
              key={slot}
              slot={slot}
              name={name}
              description={description}
              isUnlocked={isUnlocked}
              isNextToUnlock={
                !isUnlocked &&
                (slot === 1 || unlockedAbilities.includes(slot - 1))
              }
              onUnlock={() =>
                useAbilityQuizStore.getState().openUnlockModal(item, slot)
              }
            />
          );
        })
      )}
    </DetailCard>
  );
}

const styles = StyleSheet.create({
  heading: {
    fontFamily: FONTS.display,
    color: DETAIL_COLORS.heading,
    fontSize: 19,
  },
  spaced: { paddingTop: 4 },
  stats: { flexDirection: "row", gap: 12 },
});
