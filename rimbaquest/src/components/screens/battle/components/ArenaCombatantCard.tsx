import React from "react";
import { Image, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialIcons } from "@expo/vector-icons";

export function ArenaCombatantCard({
  role,
  name,
  image,
  hp,
  maxHp,
  categoryLabel,
  atk,
}: {
  role: "opponent" | "player";
  name: string;
  image: number;
  hp: number;
  maxHp: number;
  categoryLabel?: string;
  atk?: number;
}) {
  const isPlayer = role === "player";
  const washColors: [string, string] = isPlayer
    ? ["#F4FCF6", "#DFF6E7"]
    : ["#FFF5F5", "#FFE1E1"];
  const fillColors: [string, string] = isPlayer
    ? ["#9AE07A", "#4CAF50"]
    : ["#FF9B9B", "#E8541A"];
  const nameColor = isPlayer ? "#087B35" : "#8C1D24";
  const pct = maxHp > 0 ? Math.max(0, Math.min(100, (hp / maxHp) * 100)) : 0;

  return (
    <View style={styles.card}>
      <LinearGradient colors={washColors} style={styles.gradient} />
      <View style={styles.row}>
        <View style={styles.imageWrap}>
          <Image source={image} style={styles.image} resizeMode="cover" />
        </View>
        <View style={styles.info}>
          <View style={styles.headRow}>
            <Text style={[styles.name, { color: nameColor }]} numberOfLines={1}>
              {name}
            </Text>
            <View style={styles.hpTextRow}>
              <MaterialIcons name="favorite" size={11} color={nameColor} />
              <Text style={styles.hpText}>
                {hp} / {maxHp}
              </Text>
            </View>
          </View>
          <View style={styles.track}>
            <LinearGradient
              colors={fillColors}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[styles.fill, { width: `${pct}%` }]}
            />
          </View>
          {categoryLabel ? (
            <View style={styles.metaRow}>
              <View style={styles.pill}>
                <Text style={styles.pillText}>{categoryLabel}</Text>
              </View>
              {atk != null && (
                <View style={styles.atkPill}>
                  <MaterialIcons name="bolt" size={11} color="#B36200" />
                  <Text style={styles.atkPillText}>ATK {atk}</Text>
                </View>
              )}
            </View>
          ) : null}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 24,
    padding: 14,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  gradient: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0 },
  row: { flexDirection: "row", alignItems: "center", gap: 12 },
  imageWrap: {
    width: 76,
    height: 76,
    borderRadius: 18,
    overflow: "hidden",
    backgroundColor: "#FFFFFF",
  },
  image: { width: "100%", height: "100%" },
  info: { flex: 1, gap: 6 },
  headRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  name: { fontSize: 16, fontWeight: "900", flexShrink: 1 },
  hpTextRow: { flexDirection: "row", alignItems: "center", gap: 3 },
  hpText: { fontSize: 12, fontWeight: "800", color: "#1B211C" },
  track: {
    height: 10,
    backgroundColor: "rgba(0,0,0,0.08)",
    borderRadius: 5,
    overflow: "hidden",
  },
  fill: { height: "100%", borderRadius: 5 },
  metaRow: { flexDirection: "row", gap: 8, marginTop: 2 },
  pill: {
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    paddingHorizontal: 9,
    paddingVertical: 3,
  },
  pillText: { fontSize: 10, fontWeight: "800", color: "#2F7814" },
  atkPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "#FFF2DF",
    borderRadius: 10,
    paddingHorizontal: 9,
    paddingVertical: 3,
  },
  atkPillText: { fontSize: 10, fontWeight: "800", color: "#B36200" },
});
