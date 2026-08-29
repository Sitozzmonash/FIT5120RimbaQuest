import React from "react";
import { Image, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialIcons } from "@expo/vector-icons";
import { Species } from "../../../../types";
import { imageFor } from "../../../../constants/images";
import { Tap } from "../../../common/Tap";

export function BattleCardTile({
  species,
  selected,
  onPress,
}: {
  species: Species;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Tap
      label={`Select ${species.common_name}`}
      style={[styles.tile, selected && styles.tileSelected]}
      onPress={onPress}
    >
      <LinearGradient
        colors={selected ? ["#F4FCF6", "#DFF6E7"] : ["#FFFFFF", "#F8FAF8"]}
        style={styles.gradient}
      />
      <View style={styles.imageWrap}>
        <Image source={imageFor(species)!} style={styles.image} resizeMode="cover" />
      </View>
      <Text style={styles.name} numberOfLines={1}>
        {species.common_name}
      </Text>
      <View style={styles.statsRow}>
        <View style={styles.hpBadge}>
          <MaterialIcons name="favorite" size={10} color="#D9383A" />
          <Text style={styles.hpBadgeText}>{species.hp || 120}</Text>
        </View>
        <View style={styles.atkBadge}>
          <MaterialIcons name="bolt" size={10} color="#B36200" />
          <Text style={styles.atkBadgeText}>{species.base_attack || 25}</Text>
        </View>
      </View>
      <View style={[styles.cta, !selected && styles.ctaIdle]}>
        {selected && <MaterialIcons name="check-circle" size={13} color="#FFFFFF" />}
        <Text style={[styles.ctaText, !selected && styles.ctaTextIdle]}>
          {selected ? "Selected" : "Tap to select"}
        </Text>
      </View>
    </Tap>
  );
}

const styles = StyleSheet.create({
  tile: {
    width: "48%",
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#E2ECE4",
    overflow: "hidden",
    padding: 8,
    gap: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  tileSelected: { borderColor: "#0BA84A", borderWidth: 2 },
  gradient: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0 },
  imageWrap: { width: "100%", height: 96, borderRadius: 16, overflow: "hidden" },
  image: { width: "100%", height: "100%" },
  name: { color: "#0A4D26", fontSize: 14, fontWeight: "900", paddingHorizontal: 2 },
  statsRow: { flexDirection: "row", gap: 6, paddingHorizontal: 2 },
  hpBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "#FCE8E8",
    borderRadius: 8,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  hpBadgeText: { fontSize: 10, fontWeight: "800", color: "#D9383A" },
  atkBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "#FFF2DF",
    borderRadius: 8,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  atkBadgeText: { fontSize: 10, fontWeight: "800", color: "#B36200" },
  cta: {
    backgroundColor: "#0BA84A",
    borderRadius: 999,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingVertical: 7,
  },
  ctaIdle: { backgroundColor: "#DCE6DF" },
  ctaText: { color: "#FFFFFF", fontSize: 11, fontWeight: "800" },
  ctaTextIdle: { color: "#566159" },
});
