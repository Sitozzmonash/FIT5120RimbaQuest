import React from "react";
import { Image, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialIcons } from "@expo/vector-icons";
import { Species } from "../../../../types";
import { imageFor } from "../../../../constants/images";
import { Tap } from "../../../common/Tap";
import { PixelSprite } from "./PixelSprite";

export function BattleCardTile({
  species,
  selected,
  onPress,
}: {
  species: Species;
  selected: boolean;
  onPress: () => void;
}) {
  const energy = species.max_energy || species.hp || "—";
  const role = species.role || "Unknown";
  const imageSrc = imageFor(species);

  return (
    <Tap
      label={`Select ${species.common_name}, ${role} role, ${energy} Energy`}
      style={[styles.tile, selected && styles.tileSelected]}
      onPress={onPress}
    >
      <LinearGradient
        colors={selected ? ["#F4FCF6", "#DFF6E7"] : ["#FFFFFF", "#F8FAF8"]}
        style={styles.gradient}
      />
      <View style={styles.imageWrap}>
        {imageSrc ? (
          <Image source={imageSrc} style={styles.image} resizeMode="cover" />
        ) : (
          <View style={styles.artPlaceholder}>
            <MaterialIcons name="image-not-supported" size={28} color="#A0AAB0" />
            <Text style={styles.artPlaceholderText}>Art Unavailable</Text>
          </View>
        )}
        {/* Pixel Sprite Preview overlay icon */}
        <View style={styles.pixelBadge}>
          <PixelSprite
            category={species.category}
            role={role}
            speciesId={species.id}
            size={32}
          />
        </View>
      </View>
      <Text style={styles.name} numberOfLines={1}>
        {species.common_name}
      </Text>
      <View style={styles.statsRow}>
        <View style={styles.hpBadge}>
          <MaterialIcons name="bolt" size={11} color="#2E7D32" />
          <Text style={styles.hpBadgeText}>{energy} EN</Text>
        </View>
        <View style={styles.roleBadge}>
          <Text style={styles.roleBadgeText}>{role.toUpperCase()}</Text>
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
  imageWrap: {
    width: "100%",
    height: 96,
    borderRadius: 16,
    overflow: "hidden",
    position: "relative",
    backgroundColor: "#EDF2EE",
  },
  image: { width: "100%", height: "100%" },
  artPlaceholder: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F0F4F1",
    gap: 4,
  },
  artPlaceholderText: {
    fontSize: 10,
    color: "#7E8B82",
    fontWeight: "700",
  },
  pixelBadge: {
    position: "absolute",
    bottom: 4,
    right: 4,
    backgroundColor: "rgba(255, 255, 255, 0.85)",
    borderRadius: 8,
    padding: 2,
  },
  name: { color: "#0A4D26", fontSize: 14, fontWeight: "900", paddingHorizontal: 2 },
  statsRow: { flexDirection: "row", gap: 6, paddingHorizontal: 2, alignItems: "center" },
  hpBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "#E8F5E9",
    borderRadius: 8,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  hpBadgeText: { fontSize: 10, fontWeight: "800", color: "#2E7D32" },
  roleBadge: {
    backgroundColor: "#EDE7F6",
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  roleBadgeText: { fontSize: 9, fontWeight: "800", color: "#6A1B9A" },
  cta: {
    backgroundColor: "#0BA84A",
    borderRadius: 999,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingVertical: 7,
  },
  ctaIdle: { backgroundColor: "#E9F6ED" },
  ctaText: { color: "#FFFFFF", fontSize: 12, fontWeight: "800" },
  ctaTextIdle: { color: "#0BA84A" },
});
