import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { PrimaryButton } from "../../../common/PrimaryButton";
import { Tap } from "../../../common/Tap";

export function BattleEmptyState({
  onStartDiscovery,
  onBack,
}: {
  onStartDiscovery: () => void;
  onBack?: () => void;
}) {
  return (
    <View style={styles.wrap}>
      <View style={styles.iconWrap}>
        <MaterialIcons name="style" size={28} color="#087B35" />
      </View>
      <Text style={styles.title}>You Need a Wildlife Card</Text>
      <Text style={styles.copy}>
        Record a wildlife discovery to earn a card for battle.
      </Text>
      <PrimaryButton
        label="Record a Discovery"
        style={styles.cta}
        onPress={onStartDiscovery}
      />
      {onBack && (
        <Tap label="Go back" style={styles.secondaryCta} onPress={onBack}>
          <Text style={styles.secondaryCtaText}>Back</Text>
        </Tap>
      )}
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
  secondaryCta: {
    width: "100%",
    minHeight: 46,
    marginTop: 4,
    borderRadius: 23,
    borderWidth: 1,
    borderColor: "#CBECD6",
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryCtaText: { color: "#087B35", fontSize: 13, fontWeight: "700" },
});
