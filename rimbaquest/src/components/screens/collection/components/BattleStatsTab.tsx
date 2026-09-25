import React from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { BattleAbility, BattlePassive, Species } from "../../../../types";
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
  const structuredAbilities: BattleAbility[] = item.abilities ?? [];
  const passive: BattlePassive | null | undefined = item.passive;
  const abilities = [
    ...([1, 2] as const).map((slot) => {
      const ability = structuredAbilities.find((entry) => entry.slot === slot);
      return {
        slot,
        name: ability?.name || item[`ability_${slot}`] || `Ability ${slot}`,
        description: ability?.description,
        effects: ability?.effects,
      };
    }),
    {
      slot: 3,
      name: passive?.name || item.ability_3 || "Wild Instinct",
      description: passive?.description || "This species trait triggers automatically.",
      effects: passive?.effects,
    },
  ];

  return (
    <View style={styles.container}>
      <CombatAttributesCard
        energy={item.max_energy ?? item.hp ?? "—"}
        damage={item.base_attack ?? "—"}
        role={item.role || "Unknown"}
      />

      <Text style={styles.sectionTitle}>Base Actions</Text>
      <View style={styles.baseActions}>
        <View style={styles.baseAction}>
          <Text style={styles.baseActionName}>⚡ Basic Attack</Text>
          <Text style={styles.baseActionDescription}>
            {item.base_attack != null
              ? `Deal damage based on ${item.base_attack} base attack and your dice roll.`
              : "Deal damage based on your role and dice roll."}
          </Text>
        </View>
        <View style={styles.baseAction}>
          <Text style={styles.baseActionName}>🛡️ Brace Defense</Text>
          <Text style={styles.baseActionDescription}>
            Gain +6 Shield to absorb incoming damage.
          </Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Battle Abilities</Text>
      {!isProgressionKnown ? (
        <View style={styles.loadingRow}>
          <ActivityIndicator size="small" color="#0A4D26" />
          <Text style={styles.loadingText}>Checking your ability progress…</Text>
        </View>
      ) : (
        abilities.map(({ slot, name, description, effects }) => {
          const isUnlocked = unlockedAbilities.includes(slot);
          const isNextToUnlock =
            !isUnlocked && (slot === 1 || unlockedAbilities.includes(slot - 1));

          return (
            <AbilityCard
              key={slot}
              slot={slot}
              name={name}
              description={description}
              effects={effects}
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
        label="Battle with this card"
        style={styles.primary}
        onPress={() => void useBattleStore.getState().startBattle(item)}
      >
        <Text style={styles.primaryText}>Battle with This Card</Text>
      </Tap>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 16 },
  sectionTitle: { fontSize: 14, fontWeight: "500", color: "#000000" },
  baseActions: { gap: 8 },
  baseAction: {
    backgroundColor: "#F4FAF6",
    borderColor: "#CFE3D5",
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    gap: 4,
  },
  baseActionName: { fontSize: 12, fontWeight: "800", color: "#1B4D2E" },
  baseActionDescription: { fontSize: 11, color: "#5B7365" },
  loadingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 14,
  },
  loadingText: { fontSize: 12, color: "#667085", fontWeight: "600" },
  primary: {
    minHeight: 48,
    marginTop: 6,
    borderRadius: 24,
    backgroundColor: "#0BA84A",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  primaryText: { color: "#FFFFFF", fontSize: 12, fontWeight: "800" },
});
