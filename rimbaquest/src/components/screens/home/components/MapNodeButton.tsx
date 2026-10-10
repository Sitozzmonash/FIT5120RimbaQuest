import React from "react";
import {
  Image,
  ImageSourcePropType,
  Platform,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { HOME_MAP_IMAGES } from "../../../../constants/images";
import { ScaleTap } from "../../../common/ScaleTap";
import { HOME_COLORS, signTextStyle } from "../homeTheme";
import { MapBadge } from "./MapBadge";
import { WoodenSign } from "./WoodenSign";

const NODE_SIZE = 84;
const FEATURED_SIZE = 110;

// Greyed-out look for a node that isn't available yet.
const LOCKED = {
  face: "#C9C3B0",
  ink: "#5E5946",
  sign: "#9C9480",
  text: "#F3EEE2",
};

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
  // Greyed out with a padlock.
  locked?: boolean;
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
  locked = false,
  onPress,
}: MapNodeProps) {
  if (locked) {
    return (
      <ScaleTap
        label={accessibilityLabel}
        style={[styles.node, { left, top, width }]}
        onPress={onPress}
      >
        <LockedCircle>
          <Image
            source={icon}
            style={[iconSize, styles.lockedIcon]}
            resizeMode="contain"
          />
        </LockedCircle>
        <WoodenSign style={[styles.sign, styles.lockedSign]}>
          <Text style={[styles.label, styles.lockedLabel]}>{label}</Text>
        </WoodenSign>
      </ScaleTap>
    );
  }

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

function LockedCircle({ children }: { children: React.ReactNode }) {
  return (
    <View style={styles.circleSlot}>
      <View style={[styles.circle, styles.circleDrop, styles.lockedDrop]} />
      <View style={[styles.circle, styles.circleFace, styles.lockedFace]}>
        {children}
      </View>
      <Image
        source={HOME_MAP_IMAGES.lock}
        style={styles.lockBadge}
        resizeMode="contain"
      />
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
    ...StyleSheet.absoluteFill,
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

  lockedDrop: { backgroundColor: LOCKED.ink },
  lockedFace: { backgroundColor: LOCKED.face, borderColor: LOCKED.ink },
  lockedIcon:
    Platform.OS === "ios"
      ? { tintColor: LOCKED.ink, opacity: 0.4 }
      : { filter: "grayscale(1)", opacity: 0.55 },
  lockBadge: {
    position: "absolute",
    right: -6,
    top: -6,
    width: 40,
    height: 40 * (242 / 204),
  },
  lockedSign: { backgroundColor: LOCKED.sign, borderColor: LOCKED.ink },
  lockedLabel: { color: LOCKED.text, textShadowColor: LOCKED.ink },

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
