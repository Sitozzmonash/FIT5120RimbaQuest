import React from "react";
import { Image, StyleSheet, Text, View } from "react-native";
import { FONTS } from "../../../../../constants/fonts";
import { ScaleTap } from "../../../../common/ScaleTap";
import { DETAIL_COLORS, DETAIL_IMAGES } from "./detailTheme";

// Slight tilts so the grid looks like photos pinned to a board.
const TILTS = ["1.5deg", "-1.5deg", "-1deg", "1deg"];

export function SightingPolaroid({
  uri,
  location,
  index,
  onPress,
}: {
  uri?: string | null;
  location: string;
  index: number;
  onPress: () => void;
}) {
  return (
    <View
      style={[
        styles.item,
        { transform: [{ rotate: TILTS[index % TILTS.length] }] },
      ]}
    >
      <ScaleTap
        label={`Make photo from ${location} bigger`}
        style={styles.polaroid}
        onPress={onPress}
        disabled={!uri}
      >
        <View style={styles.photoFrame}>
          {uri ? (
            <Image source={{ uri }} style={styles.photo} resizeMode="cover" />
          ) : null}
        </View>
      </ScaleTap>
      <View style={styles.caption}>
        <Image
          source={DETAIL_IMAGES.locationPin}
          style={styles.pin}
          resizeMode="contain"
        />
        <Text style={styles.location} numberOfLines={1}>
          {location}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  item: { flex: 1, gap: 8 },
  polaroid: {
    height: 136 + 5,
    padding: 3,
    backgroundColor: "#FFFDF4",
    borderColor: DETAIL_COLORS.ink,
    borderWidth: 3,
    borderBottomWidth: 8,
    borderRadius: 16,
  },
  photoFrame: {
    flex: 1,
    borderRadius: 10,
    overflow: "hidden",
  },
  photo: { width: "100%", height: "100%" },
  caption: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingLeft: 4,
  },
  pin: { width: 12, height: 14.7 },
  location: {
    flexShrink: 1,
    fontFamily: FONTS.bodyExtraBold,
    color: DETAIL_COLORS.body,
    fontSize: 13,
  },
});
