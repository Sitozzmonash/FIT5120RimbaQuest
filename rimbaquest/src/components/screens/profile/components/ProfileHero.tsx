import React from "react";
import { Image, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialIcons } from "@expo/vector-icons";

export function ProfileHero({
  avatarImage,
  name,
  level,
}: {
  avatarImage: number;
  name: string;
  level: number;
}) {
  return (
    <View style={styles.wrap}>
      <View style={styles.avatarWrap}>
        <View style={styles.avatarFrame}>
          <Image source={avatarImage} style={styles.avatarImage} resizeMode="cover" />
        </View>
      </View>
      <View style={styles.levelBadge}>
        <LinearGradient colors={["#FFD940", "#FFC314"]} style={styles.levelBadgeGradient}>
          <MaterialIcons name="star" size={12} color="#0A4D26" />
          <Text style={styles.levelBadgeText}>Level {level}</Text>
        </LinearGradient>
      </View>
      <Text style={styles.name}>{name}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: "center", paddingVertical: 8, gap: 4 },
  avatarWrap: { width: 90, height: 90, marginBottom: 4 },
  avatarFrame: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 1,
    borderColor: "#0A4D26",
    backgroundColor: "#D8EDD8",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarImage: { width: 82, height: 82, borderRadius: 41 },
  cameraBadge: {
    position: "absolute",
    right: 0,
    bottom: 0,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#0A4D26",
    borderWidth: 2,
    borderColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  levelBadge: { borderRadius: 12, overflow: "hidden" },
  levelBadgeGradient: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  levelBadgeText: { color: "#0A4D26", fontSize: 11, fontWeight: "800" },
  name: { color: "#0A4D26", fontSize: 24, fontWeight: "900" },
});
