import React from "react";
import {
  Image,
  ImageSourcePropType,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { ScaleTap } from "../../../common/ScaleTap";
import { HOME_COLORS, signTextStyle } from "../homeTheme";
import { MapBadge } from "./MapBadge";
import { WoodenSign } from "./WoodenSign";

const NODE_SIZE = 84;
const FEATURED_SIZE = 110;

export type MapNodeProps = {
  label: string;
  accessibilityLabel: string;
  icon: ImageSourcePropType;
  iconSize: { width: number; height: number };
  color: string;
  left: number;
  top: number;
  width: number;
  badge?: string;
  // The main call to action gets a larger, gold-ringed node.
  featured?: boolean;
  onPress: () => void;
};

export function MapNodeButton({
  label,
  accessibilityLabel,
  icon,
  iconSize,
  color,
  left,
  top,
  width,
  badge,
  featured = false,
  onPress,
}: MapNodeProps) {
  return (
    <ScaleTap
      label={accessibilityLabel}
      style={[styles.node, { left, top, width }]}
      onPress={onPress}
    >
      {featured ? (
        <FeaturedCircle color={color}>
          <Image source={icon} style={iconSize} resizeMode="contain" />
        </FeaturedCircle>
      ) : (
        <NodeCircle color={color} badge={badge}>
          <Image source={icon} style={iconSize} resizeMode="contain" />
        </NodeCircle>
      )}
      <WoodenSign style={styles.sign}>
        <Text style={styles.label}>{label}</Text>
      </WoodenSign>
    </ScaleTap>
  );
}

function NodeCircle({
  color,
  badge,
  children,
}: {
  color: string;
  badge?: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.circleSlot}>
      <View style={[styles.circle, styles.circleDrop]} />
      <View
        style={[styles.circle, styles.circleFace, { backgroundColor: color }]}
      >
        <View style={styles.highlight} />
        <View style={[styles.highlightCover, { backgroundColor: color }]} />
        {children}
      </View>
      {badge ? <MapBadge label={badge} /> : null}
    </View>
  );
}

function FeaturedCircle({
  color,
  children,
}: {
  color: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.featuredSlot}>
      <View style={[styles.ring, styles.featuredDrop]} />
      <View style={[styles.ring, styles.featuredOuterRing]} />
      <View style={[styles.ring, styles.featuredGoldRing]} />
      <View style={[styles.featuredFace, { backgroundColor: color }]}>
        {children}
      </View>
    </View>
  );
}

const ring = (size: number, offset: number) => ({
  width: size,
  height: size,
  left: offset,
  top: offset,
});

const styles = StyleSheet.create({
  node: { position: "absolute", alignItems: "center", gap: 10 },
  sign: { paddingHorizontal: 19, paddingVertical: 7 },
  label: { ...signTextStyle, fontSize: 17, textAlign: "center" },

  circleSlot: { width: NODE_SIZE, height: NODE_SIZE },
  circle: {
    position: "absolute",
    width: NODE_SIZE,
    height: NODE_SIZE,
    borderRadius: NODE_SIZE / 2,
  },
  circleDrop: { top: 7, backgroundColor: HOME_COLORS.ink },
  circleFace: {
    borderWidth: 4,
    borderColor: HOME_COLORS.ink,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  highlight: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255, 255, 255, 0.45)",
  },
  highlightCover: {
    position: "absolute",
    top: 6,
    left: 0,
    width: NODE_SIZE - 8,
    height: NODE_SIZE - 8,
    borderRadius: (NODE_SIZE - 8) / 2,
  },

  featuredSlot: { width: FEATURED_SIZE, height: FEATURED_SIZE },
  ring: { position: "absolute", borderRadius: 999 },
  featuredDrop: {
    ...ring(FEATURED_SIZE + 4, -2),
    top: 10,
    backgroundColor: HOME_COLORS.ink,
  },
  featuredOuterRing: {
    ...ring(FEATURED_SIZE + 16, -8),
    backgroundColor: HOME_COLORS.ink,
  },
  featuredGoldRing: {
    ...ring(FEATURED_SIZE + 10, -5),
    backgroundColor: HOME_COLORS.gold,
  },
  featuredFace: {
    width: FEATURED_SIZE,
    height: FEATURED_SIZE,
    borderRadius: FEATURED_SIZE / 2,
    borderWidth: 4,
    borderColor: HOME_COLORS.ink,
    alignItems: "center",
    justifyContent: "center",
  },
});
