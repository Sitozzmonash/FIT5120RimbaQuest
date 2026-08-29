import React from "react";
import { StyleSheet, Text, View } from "react-native";

export type CategoryProgress = {
  id: string;
  label: string;
  found: number;
  total: number;
};

function percentOf(found: number, total: number): number {
  return total ? Math.min(100, Math.round((found / total) * 100)) : 0;
}

export function OverallProgressCard({
  progress,
  categories,
}: {
  progress: { found: number; total: number; xp: number; level?: number };
  categories: CategoryProgress[];
}) {
  const percentage = percentOf(progress.found, progress.total);

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

      <Text style={styles.categoryHeading}>CATEGORY COLLECTION PROGRESS</Text>

      {categories.map((item, index) => {
        const categoryPercent = percentOf(item.found, item.total);
        return (
          <View
            key={item.id}
            style={[
              styles.categoryRow,
              index === categories.length - 1 && styles.categoryRowLast,
            ]}
          >
            <View style={styles.categoryTopRow}>
              <Text style={styles.categoryLabel} numberOfLines={1}>
                {item.label}
              </Text>
              <Text style={styles.categoryValue}>
                {item.found} / {item.total}
              </Text>
            </View>
            <View style={styles.categoryTrack}>
              <View
                style={[styles.categoryFill, { width: `${categoryPercent}%` }]}
              />
            </View>
          </View>
        );
      })}
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
  categoryHeading: {
    color: "#78817B",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 0.4,
    marginTop: 18,
  },
  categoryRow: {
    borderBottomWidth: 1,
    borderBottomColor: "#EEF2EF",
    paddingVertical: 12,
  },
  categoryRowLast: { borderBottomWidth: 0, paddingBottom: 0 },
  categoryTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  categoryLabel: {
    flex: 1,
    minWidth: 0,
    color: "#1B211C",
    fontSize: 13,
    fontWeight: "800",
  },
  categoryValue: { color: "#637D6E", fontSize: 12, fontWeight: "700" },
  categoryTrack: {
    height: 6,
    backgroundColor: "#E8EEEA",
    borderRadius: 3,
    overflow: "hidden",
    marginTop: 8,
  },
  categoryFill: { height: "100%", backgroundColor: "#0BA84A", borderRadius: 3 },
});
