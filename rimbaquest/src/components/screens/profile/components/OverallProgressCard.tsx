import React from "react";
import { StyleSheet, Text, View } from "react-native";

export function OverallProgressCard({
  progress,
}: {
  progress: { found: number; total: number; xp: number; level?: number };
}) {
  const percentage = progress.total
    ? Math.min(100, Math.round((progress.found / progress.total) * 100))
    : 0;

  return (
    <View style={styles.card}>
      <Text style={styles.label}>OVERALL COLLECTION PROGRESS</Text>

      <View style={styles.topRow}>
        <Text style={styles.value} numberOfLines={1} ellipsizeMode="tail">
          {progress.found} / {progress.total} Discovered
        </Text>
        <Text style={styles.badgeText} numberOfLines={1}>
          {percentage}%
        </Text>
      </View>

      <View style={styles.track}>
        <View style={[styles.fill, { width: `${percentage}%` }]} />
      </View>

      <View style={styles.infoPair}>
        <InfoBox label="EXPLORER POINTS" value={`${progress.xp} XP`} />
        <InfoBox label="SCOUT RANK" value={`Level ${progress.level || 1}`} />
      </View>
    </View>
  );
}

function InfoBox({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoBox}>
      <Text style={styles.infoLabel} numberOfLines={1}>
        {label}
      </Text>
      <Text style={styles.infoValue} numberOfLines={1} ellipsizeMode="tail">
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderColor: "#DFE7E1",
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    backgroundColor: "#FFFFFF",
  },
  label: {
    color: "#78817B",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 0.4,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    marginTop: 6,
  },
  value: {
    flex: 1,
    minWidth: 0,
    fontSize: 19,
    color: "#1B211C",
    fontWeight: "900",
  },
  badgeText: {
    flexShrink: 0,
    color: "#0BA84A",
    fontSize: 12,
    fontWeight: "800",
    backgroundColor: "#EAF8EF",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    overflow: "hidden",
  },
  track: {
    height: 8,
    backgroundColor: "#E8EEEA",
    borderRadius: 4,
    overflow: "hidden",
    marginTop: 12,
  },
  fill: { height: "100%", backgroundColor: "#0BA84A", borderRadius: 4 },
  infoPair: { flexDirection: "row", gap: 8, marginTop: 6 },
  infoBox: {
    flex: 1,
    minWidth: 0,
    borderWidth: 1,
    borderColor: "#DFE7E1",
    borderRadius: 14,
    padding: 12,
    marginTop: 10,
    backgroundColor: "#FFFFFF",
  },
  infoLabel: {
    color: "#78817B",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 0.4,
  },
  infoValue: {
    color: "#1B211C",
    fontSize: 12,
    lineHeight: 18,
    fontWeight: "700",
    marginTop: 4,
  },
});
