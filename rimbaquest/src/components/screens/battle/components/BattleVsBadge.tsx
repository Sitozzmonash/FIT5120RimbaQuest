import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

export function BattleVsBadge() {
  return (
    <View style={styles.wrap} pointerEvents="none">
      <LinearGradient colors={["#FFD940", "#FFC314"]} style={styles.badge}>
        <Text style={styles.text}>VS</Text>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: -18,
    marginBottom: -18,
    zIndex: 5,
  },
  badge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 3,
    borderColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  text: { color: "#0A4D26", fontSize: 13, fontWeight: "900" },
});
