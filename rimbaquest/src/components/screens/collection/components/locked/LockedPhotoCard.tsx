import React from "react";
import { Image, ImageSourcePropType, StyleSheet, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { LOCKED_COLORS, LOCKED_IMAGES } from "./lockedAssets";

const BADGE_SIZE = 84;

export function LockedPhotoCard({ image }: { image?: ImageSourcePropType }) {
  return (
    <View style={styles.card}>
      {image ? (
        <Image source={image} style={styles.photo} resizeMode="cover" />
      ) : null}
      <View style={styles.tint} />
      <LinearGradient
        colors={[
          "rgba(255,255,255,0.67)",
          "rgba(255,255,255,0)",
          "rgba(255,255,255,0.67)",
        ]}
        locations={[0, 0.5, 1]}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.badgeSlot}>
        <View style={[styles.badge, styles.badgeShadow]} />
        <View style={[styles.badge, styles.badgeFace]}>
          <Image
            source={LOCKED_IMAGES.lock}
            style={styles.lock}
            resizeMode="contain"
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    height: 196,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: LOCKED_COLORS.ink,
    borderWidth: 3,
    borderBottomWidth: 8,
    borderColor: LOCKED_COLORS.ink,
    borderRadius: 20,
    overflow: "hidden",
  },
  photo: { ...StyleSheet.absoluteFill, width: "100%", height: "100%" },
  tint: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(14, 69, 39, 0.55)",
  },
  badgeSlot: { width: BADGE_SIZE, height: BADGE_SIZE + 5 },
  badge: {
    position: "absolute",
    width: BADGE_SIZE,
    height: BADGE_SIZE,
    borderRadius: BADGE_SIZE / 2,
  },
  badgeShadow: { top: 5, backgroundColor: LOCKED_COLORS.ink },
  badgeFace: {
    top: 0,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: LOCKED_COLORS.paper,
    borderWidth: 3,
    borderColor: LOCKED_COLORS.ink,
  },
  lock: { width: 46, height: 54.57 },
});
