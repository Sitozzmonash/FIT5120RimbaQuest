import React from "react";
import { Image, StyleSheet, Text, View } from "react-native";
import { FONTS } from "../../../../constants/fonts";
import { LocationItem } from "../../../../types";
import { ScaleTap } from "../../../common/ScaleTap";
import { openingHoursPills } from "../formatOpeningHours";
import { LOCATION_COLORS } from "../locationsTheme";
import { InfoPill } from "./InfoPill";
import { WoodPlank } from "../../../common/game/WoodPlank";

const GO_SIZE = 44;
const CHEVRON_RIGHT = require("../../../../../assets/locations/chevron-right.png");
const LOCATION_PIN = require("../../../../../assets/locations/location-pin.png");

export function PlaceCard({
  location,
  onPress,
  disabled = false,
}: {
  location: LocationItem;
  onPress: () => void;
  disabled?: boolean;
}) {
  const hours = openingHoursPills(location.best_time);

  return (
    <ScaleTap
      label={`View ${location.name}`}
      style={styles.card}
      onPress={onPress}
      disabled={disabled}
      pressedScale={0.96}
    >
      <WoodPlank title={location.name} />
      <View style={styles.body}>
        <View style={styles.info}>
          <View style={styles.areaRow}>
            <Image
              source={LOCATION_PIN}
              style={styles.pin}
              resizeMode="contain"
            />
            <Text style={styles.area}>{location.area}</Text>
          </View>
          {hours.length > 0 && (
            <View style={styles.tags}>
              {hours.map((label, index) => (
                <InfoPill key={label} label={label} withClock={index === 0} />
              ))}
            </View>
          )}
        </View>
        {/* <View style={styles.goSlot}>
          <View style={[styles.goCircle, styles.goShadow]} />
          <View style={[styles.goCircle, styles.goFace]}>
            <Image source={CHEVRON_RIGHT} style={styles.chevron} resizeMode="contain" />
          </View>
        </View> */}
      </View>
    </ScaleTap>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: LOCATION_COLORS.paper,
    borderWidth: 3,
    borderBottomWidth: 7,
    borderColor: LOCATION_COLORS.ink,
    borderRadius: 18,
    overflow: "hidden",
  },
  body: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingLeft: 14,
    paddingRight: 12,
    paddingVertical: 12,
  },
  info: { flex: 1, gap: 6 },
  chevron: { width: 15, height: 21 },
  pin: { width: 13, height: 16 },
  areaRow: { flexDirection: "row", alignItems: "center", gap: 5 },
  area: {
    flexShrink: 1,
    color: LOCATION_COLORS.muted,
    fontSize: 13,
    fontFamily: FONTS.bodyExtraBold,
  },
  tags: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  goSlot: { width: GO_SIZE, height: GO_SIZE + 3 },
  goCircle: {
    position: "absolute",
    width: GO_SIZE,
    height: GO_SIZE,
    borderRadius: GO_SIZE / 2,
  },
  goShadow: { top: 3, backgroundColor: LOCATION_COLORS.ink },
  goFace: {
    top: 0,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: LOCATION_COLORS.paper,
    borderWidth: 3,
    borderColor: LOCATION_COLORS.ink,
  },
});
