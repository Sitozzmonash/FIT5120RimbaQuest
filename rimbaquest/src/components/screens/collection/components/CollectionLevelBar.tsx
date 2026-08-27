import React from "react";
import { StyleSheet, Text, View } from "react-native";

const COLLECTION_TIER_COUNT = 5;
const TICK_POSITIONS = [1, 2, 3, 4];

export function CollectionLevelBar({
  found,
  total,
  percentage,
}: {
  found: number;
  total: number;
  percentage: number;
}) {
  const tiers = Array.from({ length: COLLECTION_TIER_COUNT }, (_, i) => {
    const from = Math.round((total * i) / COLLECTION_TIER_COUNT);
    const to = Math.round((total * (i + 1)) / COLLECTION_TIER_COUNT);
    const size = to - from;
    const inTier = Math.max(0, Math.min(size, found - from));
    return { level: i + 1, inTier, size };
  });

  return (
    <View style={styles.collectionLevelBarWrap}>
      <View style={styles.collectionProgressTrackOuter}>
        <View style={styles.collectionProgressTrack}>
          <View
            style={[styles.collectionProgressFill, { width: `${percentage}%` }]}
          />
        </View>
        {TICK_POSITIONS.map((i) => (
          <View
            key={i}
            style={[styles.collectionLevelTick, { left: `${i * 20}%` }]}
          >
            <View style={styles.collectionLevelTickDash} />
            <View style={styles.collectionLevelTickDash} />
            <View style={styles.collectionLevelTickDash} />
            <View style={styles.collectionLevelTickDash} />
          </View>
        ))}
      </View>
      <View style={styles.collectionLevelLabelsRow}>
        {tiers.map((tier) => (
          <View key={tier.level} style={styles.collectionLevelLabelCell}>
            <Text style={styles.collectionLevelLabelLv}>Lv{tier.level}</Text>
            <Text style={styles.collectionLevelLabelFraction}>
              {tier.inTier}/{tier.size}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  collectionLevelBarWrap: { width: "100%", marginTop: 12, gap: 6 },
  collectionProgressTrackOuter: {
    width: "100%",
    height: 10,
    position: "relative",
  },
  collectionProgressTrack: {
    width: "100%",
    height: 10,
    backgroundColor: "#D8EDD8",
    borderRadius: 5,
    overflow: "hidden",
  },
  collectionProgressFill: {
    height: "100%",
    backgroundColor: "#78B833",
    borderRadius: 5,
  },
  collectionLevelTick: {
    position: "absolute",
    top: -5,
    bottom: -5,
    width: 2,
    marginLeft: -1,
    justifyContent: "space-between",
  },
  collectionLevelTickDash: {
    width: 2,
    height: 3,
    borderRadius: 1,
    backgroundColor: "#E8541A",
  },
  collectionLevelLabelsRow: { flexDirection: "row" },
  collectionLevelLabelCell: { flex: 1, alignItems: "center", gap: 2 },
  collectionLevelLabelLv: { color: "#0A4D26", fontSize: 10, fontWeight: "800" },
  collectionLevelLabelFraction: {
    color: "#6A8A72",
    fontSize: 9,
    fontWeight: "700",
  },
});
