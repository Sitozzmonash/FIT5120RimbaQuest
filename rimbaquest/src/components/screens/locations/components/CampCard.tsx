import React from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { SvgXml } from "react-native-svg";
import { FONTS } from "../../../../constants/fonts";
import { ScaleTap } from "../../../common/ScaleTap";
import { CAMP_TENT_SVG, LOCATION_COLORS } from "../locationsTheme";
import { MAP_CARD_WIDTH } from "./MapPlaceCard";

export function CampCard({
  located,
  loading,
  onPress,
}: {
  located: boolean;
  loading: boolean;
  onPress: () => void;
}) {
  return (
    <ScaleTap
      label={
        located
          ? "Show my camp on the map"
          : "Share my location to set up my camp"
      }
      style={styles.card}
      onPress={onPress}
      disabled={loading}
      pressedScale={0.97}
    >
      <View style={styles.badge}>
        {loading ? (
          <ActivityIndicator color={LOCATION_COLORS.ink} />
        ) : (
          <SvgXml xml={CAMP_TENT_SVG} width={38} height={36} />
        )}
      </View>
      <View style={styles.details}>
        <Text style={styles.name}>Your Camp</Text>
        <Text style={styles.body}>
          {located
            ? "You are here! Your camp moves with you. Tap to jump back to it."
            : "Share your location to set up camp and find the nearest places."}
        </Text>
        <View style={styles.pill}>
          <Text style={styles.pillText}>
            {loading
              ? "Finding you..."
              : located
                ? "Tap to view"
                : "Tap to share"}
          </Text>
        </View>
      </View>
    </ScaleTap>
  );
}

const styles = StyleSheet.create({
  card: {
    width: MAP_CARD_WIDTH,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    paddingTop: 10,
    paddingBottom: 12,
    paddingHorizontal: 12,
    backgroundColor: LOCATION_COLORS.paper,
    borderWidth: 3,
    borderBottomWidth: 8,
    borderColor: LOCATION_COLORS.ink,
    borderRadius: 18,
  },
  badge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: LOCATION_COLORS.pinSelectedBg,
    borderWidth: 3,
    borderColor: LOCATION_COLORS.ink,
  },
  details: { flex: 1, gap: 6 },
  name: {
    fontFamily: FONTS.display,
    fontSize: 18,
    lineHeight: 20.7,
    color: LOCATION_COLORS.heading,
  },
  body: {
    fontFamily: FONTS.bodyExtraBold,
    fontSize: 13,
    color: LOCATION_COLORS.muted,
  },
  pill: {
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: LOCATION_COLORS.pinSelectedBg,
    borderWidth: 2,
    borderColor: LOCATION_COLORS.ink,
    borderRadius: 100,
  },
  pillText: { fontFamily: FONTS.bodyExtraBold, fontSize: 11, color: "#4A2A05" },
});
