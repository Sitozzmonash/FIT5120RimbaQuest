import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialIcons } from "@expo/vector-icons";
import { Tap } from "../../../common/Tap";

export function InfoCard({
  icon,
  label,
  value,
  onPress,
}: {
  icon: keyof typeof MaterialIcons.glyphMap;
  label: string;
  value: string;
  onPress?: () => void;
}) {
  const content = (
    <>
      <LinearGradient
        colors={["#FFFFFF", "#F4FCF6"]}
        style={StyleSheet.absoluteFill}
      />
      <MaterialIcons name={icon} size={18} color="#0A4D26" />
      <View style={styles.textCol}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.value} numberOfLines={1}>
          {value}
        </Text>
      </View>
      {onPress && (
        <MaterialIcons name="chevron-right" size={20} color="#5B7F6B" />
      )}
    </>
  );

  return onPress ? (
    <Tap
      label={`Edit ${label.toLowerCase()}`}
      style={styles.card}
      onPress={onPress}
    >
      {content}
    </Tap>
  ) : (
    <View style={styles.card}>{content}</View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    width: "100%",
    borderRadius: 24,
    padding: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },
  textCol: { flex: 1, gap: 2 },
  label: { color: "#1A1A1A", fontSize: 12, fontWeight: "600" },
  value: { color: "#1A1A1A", fontSize: 14, fontWeight: "800" },
});
