import React from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { Species } from "../../../../types";
import { useAbilityQuizStore } from "../../../../store/useAbilityQuizStore";
import { useBattleStore } from "../../../../store/useBattleStore";
import { Tap } from "../../../common/Tap";
import { CombatAttributesCard } from "./CombatAttributesCard";
import { AbilityCard } from "./AbilityCard";

const EMPTY_ABILITIES: number[] = [];

export function BattleStatsTab({ item }: { item: Species }) {
  const unlockedAbilities = useAbilityQuizStore(
    (state) => state.progressionBySpecies[item.id] ?? EMPTY_ABILITIES,
  );
  const isProgressionKnown = useAbilityQuizStore(
    (state) => item.id in state.progressionBySpecies,
  );

  const abilities = [
    item.ability_1 || "Ability 1",
    item.ability_2 || "Ability 2",
    item.ability_3 || "Ability 3",
  ];

  return (
    <View style={styles.container}>
      <CombatAttributesCard
        hp={item.hp || 120}
        damage={item.base_attack || 25}
      />

      <Text style={styles.sectionTitle}>SPECIAL ABILITIES</Text>
      {!isProgressionKnown ? (
        <View style={styles.loadingRow}>
          <ActivityIndicator size="small" color="#0A4D26" />
          <Text style={styles.loadingText}>Checking ability progress…</Text>
        </View>
      ) : (
        abilities.map((name, idx) => {
          const slot = idx + 1;
          const isUnlocked = unlockedAbilities.includes(slot);
          const isNextToUnlock =
            !isUnlocked && slot === unlockedAbilities.length + 1;

          return (
            <AbilityCard
              key={slot}
              slot={slot}
              name={name}
              isUnlocked={isUnlocked}
              isNextToUnlock={isNextToUnlock}
              onUnlock={() =>
                useAbilityQuizStore.getState().openUnlockModal(item, slot)
              }
            />
          );
        })
      )}

      <Tap
        label="Battle with Card"
        style={styles.primary}
        onPress={() => void useBattleStore.getState().startBattle(item)}
      >
        <Text style={styles.primaryText}>Enter Card Battle</Text>
      </Tap>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 16 },
  sectionTitle: { fontSize: 16, fontWeight: "500", color: "#000000" },
  loadingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 14,
  },
  loadingText: { fontSize: 13, color: "#667085", fontWeight: "600" },
  primary: {
    minHeight: 48,
    marginTop: 6,
    borderRadius: 24,
    backgroundColor: "#0BA84A",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  primaryText: { color: "#FFFFFF", fontSize: 14, fontWeight: "800" },
});
