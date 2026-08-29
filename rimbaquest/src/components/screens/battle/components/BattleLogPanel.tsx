import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";

export function BattleLogPanel({
  round,
  log,
}: {
  round: number;
  log: string[];
}) {
  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <MaterialIcons name="menu-book" size={15} color="#566159" />
        <Text style={styles.title}>Battle Log · Round {round}</Text>
      </View>
      {log.slice(-4).map((line, idx) => (
        <View key={idx} style={styles.row}>
          <View style={styles.dot} />
          <Text style={styles.text}>{line}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderColor: "#E2ECE4",
    borderRadius: 20,
    padding: 14,
    backgroundColor: "#FAFCFA",
    minHeight: 100,
    gap: 6,
  },
  headerRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 4 },
  title: { fontSize: 11, fontWeight: "900", color: "#566159" },
  row: { flexDirection: "row", alignItems: "flex-start", gap: 8 },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: "#78B833",
    marginTop: 6,
  },
  text: { flex: 1, fontSize: 11, color: "#273229", lineHeight: 16 },
});
