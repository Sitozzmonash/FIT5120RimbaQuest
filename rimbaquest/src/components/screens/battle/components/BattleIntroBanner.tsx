import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialIcons } from "@expo/vector-icons";

export function BattleIntroBanner() {
  return (
    <View style={styles.card}>
      <LinearGradient colors={["#FFF8E8", "#FFEFC0"]} style={styles.gradient} />
      <View style={styles.iconWrap}>
        <MaterialIcons name="bolt" size={26} color="#B36200" />
      </View>
      <View style={styles.copyWrap}>
        <Text style={styles.title}>Card Battle Arena</Text>
        <Text style={styles.copy}>
          Choose one discovered Wildlife Card, then start a simple battle.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    borderRadius: 24,
    padding: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  gradient: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0 },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  copyWrap: { flex: 1, gap: 4 },
  title: { color: "#8A4B08", fontSize: 16, fontWeight: "900" },
  copy: { color: "#8A4B08", fontSize: 12, lineHeight: 17 },
});
