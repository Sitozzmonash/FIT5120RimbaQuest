import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { PrimaryButton } from "../../../common/PrimaryButton";

export function BattleEmptyState({
  onStartDiscovery,
}: {
  onStartDiscovery: () => void;
}) {
  return (
    <View style={styles.wrap}>
      <View style={styles.iconWrap}>
        <MaterialIcons name="style" size={28} color="#087B35" />
      </View>
      <Text style={styles.title}>No unlocked Wildlife Cards yet</Text>
      <Text style={styles.copy}>
        Record a wildlife discovery to unlock cards for battle.
      </Text>
      <PrimaryButton
        label="Record a Discovery"
        style={styles.cta}
        onPress={onStartDiscovery}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderWidth: 1,
    borderColor: "#CBECD6",
    backgroundColor: "#F4FFF7",
    borderRadius: 24,
    padding: 22,
    alignItems: "center",
    gap: 6,
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  title: { color: "#087B35", fontSize: 15, fontWeight: "800", textAlign: "center" },
  copy: { color: "#566159", fontSize: 12, textAlign: "center", marginBottom: 6 },
  cta: { width: "100%" },
});
