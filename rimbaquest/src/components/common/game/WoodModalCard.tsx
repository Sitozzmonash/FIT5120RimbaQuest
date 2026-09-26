import React from "react";
import {
  Image,
  ImageSourcePropType,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { FONTS } from "../../../constants/fonts";
import { GameButton } from "./GameButton";
import { GAME_COLORS } from "./gameTheme";

const STAR = require("../../../../assets/discovery/success-star.png");

const GRAINS: [
  number,
  number | undefined,
  number | undefined,
  number | undefined,
  number,
][] = [
  [30, -4, undefined, 112, 0.1],
  [52, undefined, -4, 108, 0.08],
  [102, -4, undefined, 92, 0.08],
  [121, undefined, -4, 126, 0.07],
];

export function WoodModalCard({
  icon,
  iconSize = 68,
  title,
  message,
  positive,
  stars = positive,
  actionLabel = "Continue",
  onAction,
  actionVariant = "primary",
  actionLoading = false,
  secondaryLabel,
  onSecondary,
  secondaryVariant = "secondary",
  children,
}: {
  icon: ImageSourcePropType;
  iconSize?: number;
  title: string;
  message: string;
  positive: boolean;
  stars?: boolean;
  actionLabel?: string;
  onAction?: () => void;
  actionVariant?: "primary" | "danger";
  actionLoading?: boolean;
  secondaryLabel?: string;
  onSecondary?: () => void;
  secondaryVariant?: "secondary" | "danger";
  children?: React.ReactNode;
}) {
  return (
    <View style={styles.slot}>
      <View style={styles.drop} />
      <View style={styles.card}>
        {GRAINS.map(([top, left, right, width, opacity]) => (
          <View
            key={top}
            style={[styles.grain, { top, left, right, width, opacity }]}
          />
        ))}
        <View style={styles.bottomBand} />
        <Text
          style={[styles.title, { color: positive ? "#1A6B2A" : "#8B1A1A" }]}
        >
          {title}
        </Text>
        <Text style={styles.message}>{message}</Text>
        {children}
        {onAction ? (
          <GameButton
            label={actionLabel}
            variant={actionVariant}
            loading={actionLoading}
            onPress={onAction}
            style={styles.action}
          />
        ) : null}
        {secondaryLabel && onSecondary ? (
          <GameButton
            label={secondaryLabel}
            variant={secondaryVariant}
            disabled={actionLoading}
            onPress={onSecondary}
          />
        ) : null}
      </View>

      {stars && (
        <>
          <Image
            source={STAR}
            style={[styles.star, styles.starLeft]}
            resizeMode="contain"
          />
          <Image
            source={STAR}
            style={[styles.star, styles.starRight]}
            resizeMode="contain"
          />
        </>
      )}
      <Image
        source={icon}
        style={[
          styles.icon,
          {
            width: iconSize,
            height: iconSize,
            top: -iconSize / 2 - 4,
            marginLeft: -iconSize / 2,
          },
        ]}
        resizeMode="contain"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  slot: { width: "100%", maxWidth: 304, alignSelf: "center" },
  drop: {
    position: "absolute",
    top: 4,
    left: 0,
    right: 0,
    bottom: -4,
    borderRadius: 20,
    backgroundColor: "rgba(7, 60, 29, 0.45)",
  },
  card: {
    alignItems: "center",
    gap: 8,
    paddingTop: 42,
    paddingBottom: 26,
    paddingHorizontal: 20,
    backgroundColor: GAME_COLORS.paper,
    borderWidth: 4,
    borderColor: GAME_COLORS.ink,
    borderRadius: 20,
    overflow: "hidden",
  },
  grain: {
    position: "absolute",
    height: 2,
    borderRadius: 1.5,
    backgroundColor: "#825729",
  },
  bottomBand: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 6,
    backgroundColor: "#055C35",
  },
  title: { fontFamily: FONTS.button, fontSize: 22, textAlign: "center" },
  message: {
    fontFamily: FONTS.bodyBold,
    color: "#1A1A1A",
    fontSize: 14,
    lineHeight: 21,
    textAlign: "center",
  },
  action: { marginTop: 8 },
  icon: { position: "absolute", left: "50%" },
  star: { position: "absolute", top: -28, width: 48, height: 48 },
  starLeft: { left: 39 },
  starRight: { right: 47 },
});
