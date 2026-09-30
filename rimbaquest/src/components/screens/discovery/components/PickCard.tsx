import React, { useEffect, useRef } from "react";
import {
  Animated,
  Image,
  ImageSourcePropType,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { FONTS } from "../../../../constants/fonts";
import { ScaleTap } from "../../../common/ScaleTap";
import { DISCOVERY_COLORS, DISCOVERY_IMAGES } from "./discoveryTheme";

const SELECTED_SCALE = 0.9;

export function PickCard({
  image,
  label,
  selected,
  disabled = false,
  dimmed = false,
  onPress,
}: {
  image?: ImageSourcePropType;
  label: string;
  selected: boolean;
  disabled?: boolean;
  dimmed?: boolean;
  onPress: () => void;
}) {
  const scale = useRef(
    new Animated.Value(selected ? SELECTED_SCALE : 1),
  ).current;

  useEffect(() => {
    Animated.spring(scale, {
      toValue: selected ? SELECTED_SCALE : 1,
      speed: 20,
      bounciness: 8,
      useNativeDriver: true,
    }).start();
  }, [scale, selected]);

  return (
    <Animated.View
      style={[
        styles.slot,
        selected && styles.slotSelected,
        dimmed && styles.dimmed,
        { transform: [{ scale }] },
      ]}
    >
      <ScaleTap
        label={selected ? `${label} selected` : `Choose ${label}`}
        style={[styles.card, selected ? styles.cardSelected : styles.cardIdle]}
        disabled={disabled}
        onPress={onPress}
        pressedScale={0.95}
      >
        <View style={styles.photo}>
          {image ? (
            <Image source={image} style={styles.image} resizeMode="cover" />
          ) : null}
        </View>
        <Text style={styles.label} numberOfLines={1} adjustsFontSizeToFit>
          {label}
        </Text>
      </ScaleTap>
      {selected && (
        <View style={[styles.check, { pointerEvents: "none" }]}>
          <Image
            source={DISCOVERY_IMAGES.check}
            style={styles.checkImage}
            resizeMode="contain"
          />
        </View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  slot: { flex: 1 },
  slotSelected: { zIndex: 1 },
  dimmed: { opacity: 0.45 },
  card: {
    gap: 6,
    padding: 6,
    borderRadius: 16,
    borderColor: DISCOVERY_COLORS.ink,
  },
  cardIdle: {
    backgroundColor: DISCOVERY_COLORS.paper,
    borderWidth: 3,
    borderBottomWidth: 8,
  },
  cardSelected: {
    backgroundColor: DISCOVERY_COLORS.cardSelected,
    borderWidth: 4,
    borderBottomWidth: 9,
    borderColor: DISCOVERY_COLORS.gold,
  },
  photo: {
    height: 120,
    borderWidth: 2,
    borderColor: DISCOVERY_COLORS.ink,
    borderRadius: 10,
    overflow: "hidden",
    backgroundColor: "#2F6B3E",
  },
  image: { width: "100%", height: "100%" },
  label: {
    paddingBottom: 4,
    fontFamily: FONTS.bodyBlack,
    color: DISCOVERY_COLORS.heading,
    fontSize: 13,
    textAlign: "center",
  },
  check: { position: "absolute", top: -18, right: -16, width: 38, height: 38 },
  checkImage: { width: "100%", height: "100%" },
});
