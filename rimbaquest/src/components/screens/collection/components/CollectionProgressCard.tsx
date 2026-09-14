import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialIcons } from "@expo/vector-icons";
import { useDisplayProgress } from "../../../../hooks/useDisplayProgress";
import { CollectionLevelBar } from "./CollectionLevelBar";

export function CollectionProgressCard() {
  const displayProgress = useDisplayProgress();
  const percentage = displayProgress.total
    ? Math.min(
        100,
        Math.round((displayProgress.found / displayProgress.total) * 100),
      )
    : 0;

  return (
    <View style={styles.collectionProgressCardWrap}>
      <View style={styles.collectionProgressCard}>
        <LinearGradient
          colors={["#FFFFFF", "#F4FCF6"]}
          style={styles.collectionProgressCardGradient}
        />
        <View style={styles.collectionProgressTopRow}>
          <Text style={styles.collectionProgressCount}>
            {displayProgress.found} / {displayProgress.total}
          </Text>
          <View style={styles.collectionLevelPill}>
            <LinearGradient
              colors={["#FFD940", "#FFC314"]}
              style={styles.collectionLevelPillGradient}
            >
              <MaterialIcons name="star" size={12} color="#0A4D26" />
              <Text style={styles.collectionLevelPillText}>
                Level {displayProgress.level || 1}
              </Text>
            </LinearGradient>
          </View>
        </View>
        <Text style={styles.collectionProgressLabel}>Animals Found</Text>
        <CollectionLevelBar
          found={displayProgress.found}
          total={displayProgress.total}
          percentage={percentage}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  collectionProgressCardWrap: {
    position: "relative",
    marginHorizontal: 16,
    marginBottom: 18,
  },
  collectionProgressCard: {
    borderRadius: 28,
    borderWidth: 1,
    borderColor: "#E2ECE4",
    padding: 20,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  collectionProgressCardGradient: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  collectionProgressTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  collectionProgressCount: {
    color: "#0A4D26",
    fontSize: 28,
    fontWeight: "900",
  },
  collectionLevelPill: { borderRadius: 12, overflow: "hidden" },
  collectionLevelPillGradient: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  collectionLevelPillText: {
    color: "#0A4D26",
    fontSize: 11,
    fontWeight: "800",
  },
  collectionProgressLabel: {
    color: "#173F6B",
    fontSize: 14,
    fontWeight: "700",
    marginTop: 12,
  },
});
