import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Species } from "../../../../types";
import { BattleEffect } from "../../../../types/battle";
import { Tap } from "../../../common/Tap";
import { Section, Stat } from "../../../common/CommonUI";

export function BattleStatsTab({
  item,
  unlockedAbilities = [],
  onBattle,
}: {
  item: Species;
  unlockedAbilities?: number[];
  onBattle: () => void;
}) {
  const energy = item.max_energy ?? item.hp ?? '—';
  const role = item.role || 'Unknown';

  const a1Structured = item.abilities?.find((a) => a.slot === 1);
  const a2Structured = item.abilities?.find((a) => a.slot === 2);

  const a1Name = a1Structured?.name || item.ability_1 || "Ability 1";
  const a1Desc = a1Structured?.description;
  const a1EffectsList = (a1Structured as any)?.effects as BattleEffect[] | undefined;
  const a1Effects = a1EffectsList?.map((e: BattleEffect) => `${e.type.toUpperCase()}${e.value ? ` ${e.value}` : ""}`).join(" · ");
  const a2Name = a2Structured?.name || item.ability_2 || "Ability 2";
  const a2Desc = a2Structured?.description;
  const a2EffectsList = (a2Structured as any)?.effects as BattleEffect[] | undefined;
  const a2Effects = a2EffectsList?.map((e: BattleEffect) => `${e.type.toUpperCase()}${e.value ? ` ${e.value}` : ""}`).join(" · ");

  const passiveDef = item.passive || (item as any).passive_definition;
  const passiveName = passiveDef?.name || item.ability_3 || "Wild Instinct";
  const passiveDesc = passiveDef?.description || "Species trait triggers automatically.";

  return (
    <View style={styles.battleStatsContainer}>
      <View style={styles.battleStatHeader}>
        <Text style={styles.battleStatHeaderTitle}>Card Combat Attributes</Text>
        <View style={styles.stats}>
          <Stat value={`⚡ ${energy}`} label="Energy" />
          <Stat value={`🛡️ ${role.toUpperCase()}`} label="Role" />
          <Stat value={`⚔️ ${item.base_attack ?? '—'}`} label="Base Attack" />
        </View>
      </View>

      <Section title="BASE ACTIONS" />
      <View style={styles.baseActionsRow}>
        <View style={styles.baseActionBadge}>
          <Text style={styles.baseActionName}>⚡ Basic Attack</Text>
          <Text style={styles.baseActionDesc}>
            {item.base_attack
              ? `Deal direct damage based on ${item.base_attack} base attack & dice roll`
              : "Deal direct damage scaled with role & dice"}
          </Text>
        </View>
        <View style={styles.baseActionBadge}>
          <Text style={styles.baseActionName}>🛡️ Brace Defense</Text>
          <Text style={styles.baseActionDesc}>Gain +6 Shield to absorb incoming damage</Text>
        </View>
      </View>

      <Section title="COMBAT ABILITIES" />
      {[
        { slot: 1, name: a1Name, desc: a1Desc, eff: a1Effects, label: "Active 1" },
        { slot: 2, name: a2Name, desc: a2Desc, eff: a2Effects, label: "Active 2" },
      ].map(({ slot, name, desc, eff, label }) => {
        const isUnlocked = unlockedAbilities.includes(slot);
        return (
          <View
            key={slot}
            style={[
              styles.abilitySlotLocked,
              isUnlocked && styles.abilitySlotUnlocked,
            ]}
          >
            <Text style={styles.abilitySlotIcon}>{isUnlocked ? "⚡" : "🔒"}</Text>
            <View style={{ flex: 1 }}>
              <Text
                style={[
                  styles.abilitySlotName,
                  isUnlocked && styles.abilitySlotNameUnlocked,
                ]}
              >
                {label}: {name}
              </Text>
              {eff ? (
                <Text style={styles.abilitySlotEff}>{eff}</Text>
              ) : null}
              {desc ? (
                <Text style={styles.abilitySlotDesc}>{desc}</Text>
              ) : null}
              <Text
                style={[
                  styles.abilitySlotHint,
                  isUnlocked && styles.abilitySlotHintUnlocked,
                ]}
              >
                {isUnlocked
                  ? "Unlocked (Available on roll 4-6)"
                  : `Locked (Pass Quiz ${slot} to unlock)`}
              </Text>
            </View>
          </View>
        );
      })}

      <Section title="SPECIES TRAIT (PASSIVE)" />
      <View style={styles.passiveSlot}>
        <Text style={styles.passiveSlotIcon}>{unlockedAbilities.includes(3) ? '🌟' : '🔒'}</Text>
        <View style={{ flex: 1 }}>
          <Text style={styles.passiveSlotName}>
            Passive: {passiveName}
          </Text>
          <Text style={styles.passiveSlotHint}>
            {!unlockedAbilities.includes(3)
              ? 'Pass Quiz 3 to unlock this automatic trait.'
              : passiveDesc}
          </Text>
        </View>
      </View>

      <Tap label="Battle with Card" style={styles.primary} onPress={onBattle}>
        <Text style={styles.primaryText}>Enter Card Battle</Text>
      </Tap>
    </View>
  );
}

const styles = StyleSheet.create({
  stats: { flexDirection: "row", gap: 12, marginVertical: 16 },
  battleStatsContainer: { gap: 10 },
  battleStatHeader: {
    borderWidth: 1,
    borderColor: "#DFE7E1",
    borderRadius: 16,
    padding: 14,
    backgroundColor: "#FFFFFF",
  },
  battleStatHeaderTitle: { fontSize: 14, fontWeight: "800", color: "#1B211C" },
  baseActionsRow: {
    gap: 6,
    marginBottom: 6,
  },
  baseActionBadge: {
    backgroundColor: "#F4FAF6",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#CFE3D5",
    padding: 10,
    gap: 2,
  },
  baseActionName: {
    fontSize: 12,
    fontWeight: "800",
    color: "#1B4D2E",
  },
  baseActionDesc: {
    fontSize: 11,
    color: "#5B7365",
  },
  abilitySlotLocked: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderWidth: 1,
    borderColor: "#E1E8E3",
    borderRadius: 12,
    padding: 10,
    backgroundColor: "#F8FAF8",
    marginBottom: 6,
  },
  abilitySlotUnlocked: {
    backgroundColor: "#EBF7F0",
    borderColor: "#2C6B4F",
  },
  abilitySlotIcon: { fontSize: 16 },
  abilitySlotName: { fontSize: 12, fontWeight: "800", color: "#566159" },
  abilitySlotNameUnlocked: { color: "#2C6B4F" },
  abilitySlotEff: { fontSize: 10, fontWeight: "700", color: "#0BA84A", marginTop: 2 },
  abilitySlotDesc: { fontSize: 11, color: "#374151", marginTop: 2 },
  abilitySlotHint: { fontSize: 10, color: "#879089", marginTop: 2 },
  abilitySlotHintUnlocked: { color: "#5B7365" },
  passiveSlot: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderWidth: 1.5,
    borderColor: "#E1BEE7",
    borderRadius: 12,
    padding: 10,
    backgroundColor: "#F3E5F5",
    marginBottom: 10,
  },
  passiveSlotIcon: { fontSize: 16 },
  passiveSlotName: { fontSize: 12, fontWeight: "800", color: "#4A148C" },
  passiveSlotHint: { fontSize: 10, color: "#6A1B9A", marginTop: 2 },
  primary: {
    backgroundColor: "#2C6B4F",
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 6,
  },
  primaryText: { color: "#FFFFFF", fontSize: 13, fontWeight: "800" },
});
