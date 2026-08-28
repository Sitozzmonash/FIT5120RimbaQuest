import React from "react";
import { StyleSheet, Text, View } from "react-native";

export function ProfileHero({
  avatarEmoji,
  name,
  subtitle,
}: {
  avatarEmoji: string;
  name: string;
  subtitle: string;
}) {
  return (
    <View style={styles.wrap}>
      <View style={styles.avatarWrap}>
        <View style={styles.avatarFrame}>
          <Text style={styles.avatarEmoji}>{avatarEmoji}</Text>
        </View>
      </View>
      <Text style={styles.name}>{name}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
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
  avatarEmoji: { fontSize: 42 },
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
  name: { color: "#0A4D26", fontSize: 24, fontWeight: "900" },
  subtitle: { color: "#2D5A3E", fontSize: 13, fontWeight: "600" },
});
