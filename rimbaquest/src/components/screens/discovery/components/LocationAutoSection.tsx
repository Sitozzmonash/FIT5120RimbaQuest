import React from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useDiscoveryStore } from "../../../../store/useDiscoveryStore";

export function LocationAutoSection() {
  const discoveryLocation = useDiscoveryStore(
    (state) => state.discoveryLocation,
  );
  const resolvingLocation = useDiscoveryStore(
    (state) => state.resolvingLocation,
  );

  if (resolvingLocation) {
    return (
      <View style={styles.detectingRow}>
        <ActivityIndicator size="small" color="#087B35" />
        <Text style={styles.muted}>Detecting your location...</Text>
      </View>
    );
  }

  if (discoveryLocation) {
    return (
      <View style={styles.detectedRow}>
        <MaterialIcons name="my-location" size={16} color="#087B35" />
        <Text style={styles.detectedText} numberOfLines={2}>
          {discoveryLocation}
        </Text>
      </View>
    );
  }

  return (
    <Text style={styles.muted}>
      RimbaQuest will use this device's current location when you save the
      discovery.
    </Text>
  );
}

const styles = StyleSheet.create({
  muted: { color: "#707872", fontSize: 12, lineHeight: 18 },
  detectingRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  detectedRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#EDF5EF",
    borderRadius: 12,
    padding: 10,
  },
  detectedText: {
    flex: 1,
    color: "#0A4D26",
    fontSize: 13,
    fontWeight: "700",
  },
});
