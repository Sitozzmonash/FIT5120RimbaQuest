import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { MaterialCommunityIcons, MaterialIcons } from "@expo/vector-icons";

function StatCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: number;
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

export function CombatAttributesCard({ hp, damage }: { hp: number; damage: number }) {
  return (
    <View style={styles.battleStatHeader}>
      <Text style={styles.battleStatHeaderTitle}>Card Power</Text>
      <View style={styles.stats}>
        <StatCard
          label="HEALTH"
          value={hp}
          icon={<MaterialIcons name="favorite" size={26} color="#D9383A" />}
        />
        <StatCard
          label="ATTACK POWER"
          value={damage}
          icon={<MaterialCommunityIcons name="sword-cross" size={22} color="#4A554D" />}
        />
      </View>
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
    gap: 10,
  },
  battleStatHeaderTitle: { fontSize: 16, fontWeight: "600", color: "#000000" },
  stats: { flexDirection: "row", gap: 10 },
  statCard: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#E4E7EC",
    borderRadius: 12,
    padding: 12,
    gap: 2,
  },
  statCardLabel: { fontSize: 14, fontWeight: "700", color: "#000000" },
  statCardValueRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  statCardValue: { fontSize: 24, fontWeight: "500", color: "#12B347" },
});
