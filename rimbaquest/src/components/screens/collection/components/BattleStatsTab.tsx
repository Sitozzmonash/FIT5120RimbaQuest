import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Species } from "../../../../types";
import { Tap } from "../../../common/Tap";
import { Section, Stat } from "../../../common/CommonUI";

export function BattleStatsTab({
  item,
  onBattle,
}: {
  item: Species;
  onBattle: () => void;
}) {
  return (
    <View style={styles.battleStatsContainer}>
      <View style={styles.battleStatHeader}>
        <Text style={styles.battleStatHeaderTitle}>Card Combat Attributes</Text>
        <View style={styles.stats}>
          <Stat value={`❤️ ${item.hp || 120}`} label="HP" />
          <Stat value={`⚔️ ${item.base_attack || 25}`} label="Base Attack" />
        </View>
      </View>

      <Section title="SPECIAL ABILITIES" />
      {[
        item.ability_1 || "Ability 1",
        item.ability_2 || "Ability 2",
        item.ability_3 || "Ability 3",
      ].map((ability, idx) => (
        <View key={idx} style={styles.abilitySlotLocked}>
          <Text style={styles.abilitySlotIcon}>🔒</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.abilitySlotName}>
              Ability {idx + 1}: {ability}
            </Text>
            <Text style={styles.abilitySlotHint}>Locked</Text>
          </View>
        </View>
      ))}

      {/* <Tap label="Battle with Card" style={styles.primary} onPress={onBattle}>
        <Text style={styles.primaryText}>Enter Card Battle</Text>
      </Tap> */}
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
  abilitySlotIcon: { fontSize: 16 },
  abilitySlotName: { fontSize: 12, fontWeight: "800", color: "#566159" },
  abilitySlotHint: { fontSize: 10, color: "#879089", marginTop: 2 },
  primary: {
    minHeight: 48,
    marginTop: 14,
    borderRadius: 24,
    backgroundColor: "#0BA84A",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  primaryText: { color: "#FFFFFF", fontSize: 14, fontWeight: "800" },
});
