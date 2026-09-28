import React from "react";
import {
  Image,
  ImageSourcePropType,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { FONTS } from "../../../../constants/fonts";
import { DISCOVERY_COLORS, DISCOVERY_IMAGES } from "./discoveryTheme";

const CARD_WIDTH = 250;

export function CollectibleCard({
  name,
  category,
  photo,
}: {
  name: string;
  category: string;
  photo?: ImageSourcePropType;
}) {
  return (
    <View style={styles.slot}>
      <View style={styles.drop} />
      <View style={styles.inkRing}>
        <View style={styles.goldRing}>
          <View style={styles.card}>
            <View style={styles.photo}>
              {photo ? (
                <Image source={photo} style={styles.image} resizeMode="cover" />
              ) : null}
            </View>
            <Text style={styles.name} numberOfLines={2}>
              {name}
            </Text>
            <View style={styles.pill}>
              <Text style={styles.pillText}>{category}</Text>
            </View>
          </View>
        </View>
      </View>
      <Image
        source={DISCOVERY_IMAGES.pawMedal}
        style={styles.medal}
        resizeMode="contain"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  slot: { width: CARD_WIDTH + 16, alignSelf: "center" },
  drop: {
    position: "absolute",
    top: 12,
    left: 0,
    right: 0,
    bottom: -12,
    borderRadius: 28,
    backgroundColor: DISCOVERY_COLORS.ink,
  },
  inkRing: {
    padding: 3,
    backgroundColor: DISCOVERY_COLORS.ink,
    borderRadius: 28,
  },
  goldRing: {
    padding: 5,
    backgroundColor: DISCOVERY_COLORS.gold,
    borderRadius: 25,
  },
  card: {
    backgroundColor: DISCOVERY_COLORS.paper,
    borderWidth: 3,
    borderColor: DISCOVERY_COLORS.ink,
    borderRadius: 20,
    overflow: "hidden",
  },
  pill: {
    alignSelf: "center",
    marginBottom: 16,
    paddingHorizontal: 10,
    paddingVertical: 1,
    backgroundColor: DISCOVERY_COLORS.mint,
    borderWidth: 2,
    borderColor: DISCOVERY_COLORS.ink,
    borderRadius: 999,
  },
  pillText: {
    fontFamily: FONTS.bodyBlack,
    color: DISCOVERY_COLORS.mintText,
    fontSize: 12,
  },
  photo: {
    height: 176,
    marginTop: 12,
    marginHorizontal: 12,
    backgroundColor: "#2F6B3E",
    borderWidth: 3,
    borderColor: DISCOVERY_COLORS.ink,
    borderRadius: 10,
    overflow: "hidden",
  },
  image: { width: "100%", height: "100%" },
  name: {
    paddingTop: 12,
    paddingBottom: 6,
    paddingHorizontal: 12,
    fontFamily: FONTS.display,
    color: DISCOVERY_COLORS.heading,
    fontSize: 24,
    textAlign: "center",
  },
  medal: {
    position: "absolute",
    top: -26,
    right: -34,
    width: 70,
    height: 80,
    transform: [{ rotate: "8deg" }],
  },
});
