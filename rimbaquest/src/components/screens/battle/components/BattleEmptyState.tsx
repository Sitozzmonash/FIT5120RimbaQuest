import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useDiscoveryStore } from "../../../../store/useDiscoveryStore";
import { useNavigationStore } from "../../../../store/useNavigationStore";
import { PrimaryButton } from "../../../common/PrimaryButton";
import { Tap } from "../../../common/Tap";

export function BattleEmptyState() {
  return (
    <View style={styles.wrap}>
      <View style={styles.iconWrap}>
        <MaterialIcons name="style" size={28} color="#087B35" />
      </View>
      <Text style={styles.title}>You Need an Animal Card</Text>
      <Text style={styles.copy}>
        Take an animal photo to earn a card for battle.
      </Text>
      <PrimaryButton
        label="Take an Animal Photo"
        style={styles.cta}
        onPress={() => useDiscoveryStore.getState().start()}
      />
      <Tap
        label="Return to Home"
        style={styles.secondaryCta}
        onPress={() => useNavigationStore.getState().resetTo("home")}
      >
        <Text style={styles.secondaryCtaText}>Return to Home</Text>
      </Tap>
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
