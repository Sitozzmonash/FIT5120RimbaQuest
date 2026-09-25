import React from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { BattleAbility, BattlePassive, Species } from "../../../../types";
import { useAbilityQuizStore } from "../../../../store/useAbilityQuizStore";
import { useNavigationStore } from "../../../../store/useNavigationStore";
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
  const wildlifeAbilities = item.wildlife_abilities ?? [];
  // Prefer the server's battle-mode text; the catalogue text still
  // describes the retired dice rules.
  const abilities = wildlifeAbilities.length === 3
    ? wildlifeAbilities.map(({ slot, name, description, cost }) => ({
      slot,
      name,
      description,
      effects: undefined,
      energyCost: cost,
    }))
    : [
      ...([1, 2] as const).map((slot) => {
        const ability = structuredAbilities.find((entry) => entry.slot === slot);
        return {
          slot,
          name: ability?.name || item[`ability_${slot}`] || `Ability ${slot}`,
          description: ability?.description?.replace(/Energy/g, "HP"),
          effects: ability?.effects,
          energyCost: slot,
        };
      }),
      {
        slot: 3,
        name: passive?.name || item.ability_3 || "Wild Instinct",
        description: "A species-inspired special move you choose during battle.",
        effects: undefined,
        energyCost: 4,
      },
    ];

  return (
    <View style={styles.container}>
      <CombatAttributesCard
        hp={item.hp ?? item.max_energy ?? "—"}
        damage={item.base_attack ?? "—"}
        role={item.role || "Unknown"}
      />

      <Text style={styles.habitat}>Habitat: {item.habitat || "Unknown"}</Text>
      <Text style={styles.habitatHint}>A matching habitat gives +20% Attack and Defence for the whole battle.</Text>

      <Text style={styles.sectionTitle}>Basic Action</Text>
      <View style={styles.baseActions}>
        <View style={styles.baseAction}>
          <Text style={styles.baseActionName}>⚔️ Basic Attack · 0 Energy</Text>
          <Text style={styles.baseActionDescription}>
            {item.base_attack != null
              ? `Attack using ${item.base_attack} Base Attack.`
              : "Attack using this card's Base Attack."}
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
        abilities.map(({ slot, name, description, effects, energyCost }) => {
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
              energyCost={energyCost}
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
        label="Open Wildlife Card Battle"
        style={styles.primary}
        onPress={() => useNavigationStore.getState().open("battle_select")}
      >
        <Text style={styles.primaryText}>Go to Battle</Text>
      </Tap>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 16 },
  habitat: { fontSize: 12, color: "#1B4D2E", fontWeight: "700" },
  habitatHint: { fontSize: 11, color: "#4A554D" },
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
