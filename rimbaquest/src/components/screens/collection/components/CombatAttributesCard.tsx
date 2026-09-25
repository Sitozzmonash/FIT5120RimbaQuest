import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { MaterialCommunityIcons, MaterialIcons } from "@expo/vector-icons";

function StatCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: number | string;
  icon: React.ReactNode;
}) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statCardLabel}>{label}</Text>
      <View style={styles.statCardValueRow}>
        {icon}
        <Text style={styles.statCardValue}>{value}</Text>
      </View>
    </View>
  );
}

export function CombatAttributesCard({
  hp,
  damage,
  role,
}: {
  hp: number | string;
  damage: number | string;
  role: string;
}) {
  return (
    <View style={styles.battleStatHeader}>
      <Text style={styles.battleStatHeaderTitle}>Card Power</Text>
      <Text style={styles.role}>Role: {role}</Text>
      <View style={styles.stats}>
        <StatCard
          label="HP"
          value={hp}
          icon={<MaterialIcons name="favorite" size={24} color="#D9383A" />}
        />
        <StatCard
          label="Base Attack"
          value={damage}
          icon={<MaterialCommunityIcons name="sword-cross" size={22} color="#4A554D" />}
        />
      </View>
      <Text style={styles.energyRule}>Battle Energy starts at 5 of 8. A completed turn restores 2.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  battleStatHeader: {
    borderWidth: 1,
    borderColor: "#E4E7EC",
    borderRadius: 16,
    padding: 16,
    backgroundColor: "#FFFFFF",
    gap: 8,
  },
  battleStatHeaderTitle: { fontSize: 14, fontWeight: "500", color: "#000000" },
  role: { fontSize: 12, fontWeight: "600", color: "#4A554D" },
  stats: { flexDirection: "row", gap: 10 },
  energyRule: { fontSize: 11, color: "#4A554D" },
  statCard: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#E4E7EC",
    borderRadius: 12,
    padding: 12,
    gap: 2,
  },
  statCardLabel: { fontSize: 12, fontWeight: "700", color: "#000000" },
  statCardValueRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  statCardValue: { fontSize: 18, fontWeight: "500", color: "#12B347" },
});
