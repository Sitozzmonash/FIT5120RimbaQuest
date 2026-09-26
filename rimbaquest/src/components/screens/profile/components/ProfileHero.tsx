import React from "react";
import {
  Image,
  ImageSourcePropType,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { outlinedTitleStyle } from "../../../common/game/gameTheme";
import { PROFILE_COLORS } from "../profileTheme";
import { LevelPill } from "./LevelPill";

const AVATAR_SIZE = 80;

const ring = (size: number, offset: number) => ({
  width: size,
  height: size,
  left: offset,
  top: offset,
});

export function ProfileHero({
  avatarImage,
  name,
  level,
}: {
  avatarImage: ImageSourcePropType;
  name: string;
  level: number;
}) {
  return (
    <View style={styles.hero}>
      <View style={styles.avatarSlot}>
        <View style={[styles.ring]} />
        {/* <View style={[styles.ring, styles.outerRing]} /> */}
        {/* <View style={[styles.ring, styles.goldRing]} /> */}
        <View style={styles.avatar}>
          <Image
            source={avatarImage}
            style={styles.avatarImage}
            resizeMode="contain"
          />
        </View>
      </View>
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>
          {name}
        </Text>
        <LevelPill level={level} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // Horizontal padding keeps the avatar's outer ring inside the screen edge.
  hero: {
    flexDirection: "row",
    alignItems: "center",
    gap: 20,
    paddingHorizontal: 8,
  },
  avatarSlot: { width: AVATAR_SIZE, height: AVATAR_SIZE },
  ring: { position: "absolute", borderRadius: 999 },
  outerRing: {
    ...ring(AVATAR_SIZE + 14, -7),
    backgroundColor: PROFILE_COLORS.ink,
  },
  goldRing: {
    ...ring(AVATAR_SIZE + 8, -4),
    backgroundColor: PROFILE_COLORS.gold,
  },
  avatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    borderWidth: 3,
    borderColor: PROFILE_COLORS.ink,
    backgroundColor: PROFILE_COLORS.avatarBg,
    overflow: "hidden",
  },
  avatarImage: { width: "100%", height: "100%" },
  info: { flex: 1, alignItems: "flex-start", gap: 8 },
  name: {
    ...outlinedTitleStyle,
    textShadowColor: PROFILE_COLORS.ink,
    fontSize: 26,
    lineHeight: 29,
  },
});
