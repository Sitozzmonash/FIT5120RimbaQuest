import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { useDiscoveryStore } from "../../../../store/useDiscoveryStore";
import { ViewfinderFrame } from "./ViewfinderFrame";

export function ViewfinderOverlay() {
  const photoError = useDiscoveryStore((state) => state.photoError);

  return (
    <View style={styles.viewfinder}>
      <View style={styles.instructionBanner}>
        <View style={styles.pulseDot} />
        <Text style={styles.instructionText}>
          Point at an animal and tap the button
        </Text>
      </View>

      <ViewfinderFrame />

      {photoError ? <Text style={styles.errorBanner}>{photoError}</Text> : null}

      <View style={styles.disclaimer}>
        <Text style={styles.disclaimerText}>
          Your photo helper will try to find the animal
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  viewfinder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 20,
  },
  instructionBanner: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.67)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  pulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#78B833",
  },
  instructionText: { color: "#FFFFFF", fontSize: 13, fontWeight: "700" },
  errorBanner: {
    color: "#FFFFFF",
    backgroundColor: "rgba(217,56,58,0.85)",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 12,
    fontWeight: "700",
    textAlign: "center",
  },
  disclaimer: {
    backgroundColor: "rgba(0,0,0,0.5)",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  disclaimerText: {
    color: "#9EADA3",
    fontSize: 11,
    fontWeight: "600",
    textAlign: "center",
  },
});
