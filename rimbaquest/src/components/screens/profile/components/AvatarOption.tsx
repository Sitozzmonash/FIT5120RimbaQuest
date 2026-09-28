import React from "react";
import {
  Image,
  ImageSourcePropType,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { FONTS } from "../../../../constants/fonts";
import { ScaleTap } from "../../../common/ScaleTap";
import { PROFILE_COLORS } from "../profileTheme";

const CHECK_BADGE = require("../../../../../assets/profile/check-badge.png");

export function AvatarOption({
  label,
  image,
  selected,
  onPress,
}: {
  label: string;
  image: ImageSourcePropType;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <ScaleTap
      label={`Choose the ${label} avatar`}
      style={[styles.tile, selected ? styles.tileSelected : styles.tileIdle]}
      onPress={onPress}
    >
      {selected && <View style={styles.insetShade} />}
      <View style={styles.art}>
        <Image source={image} style={styles.artImage} resizeMode="contain" />
      </View>
      <Text style={styles.label} numberOfLines={1}>
        {label}
      </Text>
      {selected && (
        <Image source={CHECK_BADGE} style={styles.badge} resizeMode="contain" />
      )}
    </ScaleTap>
  );
}

const styles = StyleSheet.create({
  tile: {
    flex: 1,
    height: 100,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingHorizontal: 4,
    paddingVertical: 8,
    borderWidth: 3,
    borderColor: PROFILE_COLORS.ink,
    borderRadius: 16,
  },
  tileIdle: { height: 100, backgroundColor: "#FFFFFF", borderBottomWidth: 7 },
  tileSelected: {
    backgroundColor: PROFILE_COLORS.goldLight,
    borderBottomWidth: 3,
  },
  insetShade: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 4,
    borderTopLeftRadius: 13,
    borderTopRightRadius: 13,
    backgroundColor: "rgba(7, 60, 29, 0.25)",
  },
  art: {
    width: 54,
    height: 54,
    borderRadius: 27,
    borderWidth: 2,
    borderColor: PROFILE_COLORS.ink,
    overflow: "hidden",
  },
  artImage: { width: "100%", height: "100%" },
  label: {
    fontFamily: FONTS.display,
    color: PROFILE_COLORS.heading,
    fontSize: 14,
  },
  badge: {
    position: "absolute",
    top: -11,
    right: -11,
    width: 26,
    height: 26,
  },
});
