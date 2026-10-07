import React from "react";
import { Image, StyleSheet, Text, View } from "react-native";
import { FONTS } from "../../../../constants/fonts";
import { LocationItem } from "../../../../types";
import { ScaleTap } from "../../../common/ScaleTap";
import { formatDistanceAway } from "../../../../utils/locationDiscovery";
import { openingHoursPills } from "../formatOpeningHours";
import { LOCATION_COLORS } from "../locationsTheme";
import { DistancePill } from "./DistancePill";

export const MAP_CARD_WIDTH = 300;

export function MapPlaceCard({
  location,
  distanceKm,
  onPress,
}: {
  location: LocationItem;
  distanceKm?: number;
  onPress: () => void;
}) {
  const hours = openingHoursPills(location.best_time)[0];
  const distance = formatDistanceAway(distanceKm);

  return (
    <ScaleTap
      label={`View ${location.name}`}
      style={[styles.card, styles.topRow]}
      onPress={onPress}
      pressedScale={0.97}
    >
      {location.image_url ? (
        <Image
          source={{ uri: location.image_url }}
          style={styles.photo}
          resizeMode="cover"
        />
      ) : null}
      <View style={styles.details}>
        <Text style={styles.name}>{location.name}</Text>
        {location.area ? (
          <Text style={styles.area}>{location.area}</Text>
        ) : null}
        <View style={styles.pills}>
          {distance ? <DistancePill label={distance} /> : null}
          {hours ? (
            <View style={[styles.pill, styles.hoursPill]}>
              <Text style={[styles.pillText, styles.hoursText]}>{hours}</Text>
            </View>
          ) : null}
        </View>
      </View>
    </ScaleTap>
  );
}

const styles = StyleSheet.create({
  card: {
    width: MAP_CARD_WIDTH,
    paddingTop: 10,
    paddingBottom: 12,
    paddingHorizontal: 12,
    backgroundColor: "#FFFFFF",
    borderWidth: 3,
    borderBottomWidth: 8,
    borderColor: LOCATION_COLORS.ink,
    borderRadius: 18,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    minHeight: 84,
  },
  photo: {
    width: 84,
    height: 84,
    borderWidth: 3,
    borderColor: LOCATION_COLORS.ink,
    borderRadius: 12,
  },
  details: { flex: 1, gap: 6 },
  name: {
    fontFamily: FONTS.display,
    fontSize: 18,
    lineHeight: 20.7,
    color: LOCATION_COLORS.heading,
  },
  area: {
    fontFamily: FONTS.bodyExtraBold,
    fontSize: 13,
    color: LOCATION_COLORS.muted,
  },
  pills: { flexDirection: "row", flexWrap: "wrap", columnGap: 6, rowGap: 4 },
  pill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 2,
    borderRadius: 100,
  },
  hoursPill: {
    backgroundColor: LOCATION_COLORS.pillBg,
    borderColor: LOCATION_COLORS.pillBorder,
  },
  pillText: { fontFamily: FONTS.bodyExtraBold, fontSize: 11 },
  hoursText: { color: LOCATION_COLORS.ink },
});
