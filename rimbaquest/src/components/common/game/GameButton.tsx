import React from "react";
import {
  ActivityIndicator,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from "react-native";
import { FONTS } from "../../../constants/fonts";
import { ScaleTap } from "../ScaleTap";
import { GAME_COLORS } from "./gameTheme";

export type GameButtonSize = "s" | "m" | "l" | "xl";

type Gel = { left: number; top: number };

const SIZES: Record<
  GameButtonSize,
  {
    faceHeight: number;
    radius: number;
    paddingX: number;
    labelSize: number;
    gelTop: { width: number; height: number };
    gelLeft: { width: number; height: number };
    gelRadius: number;
    primaryGel: Gel;
    secondaryGel: Gel;
    secondaryDrop: number;
  }
> = {
  s: {
    faceHeight: 43,
    radius: 14,
    paddingX: 18,
    labelSize: 20,
    gelTop: { width: 42, height: 10 },
    gelLeft: { width: 10, height: 19 },
    gelRadius: 5,
    primaryGel: { left: 4, top: 1 },
    secondaryGel: { left: 2, top: -1 },
    secondaryDrop: 3,
  },
  m: {
    faceHeight: 54,
    radius: 18,
    paddingX: 24,
    labelSize: 24,
    gelTop: { width: 54, height: 12 },
    gelLeft: { width: 12, height: 24 },
    gelRadius: 6,
    primaryGel: { left: 6, top: 2 },
    secondaryGel: { left: 4, top: 0 },
    secondaryDrop: 4,
  },
  l: {
    faceHeight: 72,
    radius: 24,
    paddingX: 36,
    labelSize: 34,
    gelTop: { width: 72, height: 16 },
    gelLeft: { width: 16, height: 32 },
    gelRadius: 8,
    primaryGel: { left: 9, top: 3 },
    secondaryGel: { left: 7, top: 1 },
    secondaryDrop: 5,
  },
  xl: {
    faceHeight: 86,
    radius: 28,
    paddingX: 44,
    labelSize: 40,
    gelTop: { width: 86, height: 19 },
    gelLeft: { width: 19, height: 38 },
    gelRadius: 9.5,
    primaryGel: { left: 11, top: 4 },
    secondaryGel: { left: 9, top: 2 },
    secondaryDrop: 6,
  },
};

// Every primary button drops the same 5px shadow.
const PRIMARY_DROP = 5;

export function GameButton({
  label,
  onPress,
  variant = "primary",
  size = "s",
  width = "full",
  loading = false,
  disabled = false,
  style,
}: {
  label: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "danger";
  size?: GameButtonSize;
  width?: "full" | "hug";
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const primary = variant !== "secondary";
  const inactive = disabled || loading;
  const t = SIZES[size];
  const gel = primary ? t.primaryGel : t.secondaryGel;
  const gelColor = primary ? styles.gelPrimary : styles.gelSecondary;

  return (
    <ScaleTap
      label={label}
      onPress={onPress}
      disabled={inactive}
      pressedScale={0.96}
      style={[
        width === "full" ? styles.full : styles.hug,
        !primary && { paddingBottom: t.secondaryDrop },
        inactive && styles.inactive,
        style,
      ]}
    >
      {!primary && (
        <View
          style={[
            styles.secondaryBase,
            {
              top: t.secondaryDrop,
              height: t.faceHeight,
              borderRadius: t.radius,
            },
          ]}
        />
      )}
      <View
        style={[
          styles.face,
          { borderRadius: t.radius, paddingHorizontal: t.paddingX },
          primary
            ? [
                styles.primaryFace,
                variant === "danger" && styles.dangerFace,
                { height: t.faceHeight + PRIMARY_DROP },
              ]
            : [styles.secondaryFace, { height: t.faceHeight }],
        ]}
      >
        {primary && <View style={styles.innerShade} />}
        <View
          style={[
            styles.gel,
            gelColor,
            styles.gelTopOpacity,
            gel,
            t.gelTop,
            { borderRadius: t.gelRadius },
          ]}
        />
        <View
          style={[
            styles.gel,
            gelColor,
            styles.gelLeftOpacity,
            gel,
            t.gelLeft,
            { borderRadius: t.gelRadius },
          ]}
        />
        {loading ? (
          <ActivityIndicator color={primary ? "#FFFFFF" : GAME_COLORS.ink} />
        ) : (
          <Text
            style={[
              styles.label,
              { fontSize: t.labelSize },
              primary ? styles.primaryLabel : styles.secondaryLabel,
            ]}
            numberOfLines={1}
          >
            {label}
          </Text>
        )}
      </View>
    </ScaleTap>
  );
}

const styles = StyleSheet.create({
  full: { alignSelf: "stretch" },
  hug: { alignSelf: "flex-start" },
  inactive: { opacity: 0.6 },
  face: {
    alignItems: "center",
    justifyContent: "center",
    borderColor: GAME_COLORS.ink,
    overflow: "hidden",
  },
  dangerFace: { backgroundColor: "#D9383A" },
  primaryFace: {
    backgroundColor: GAME_COLORS.go,
    borderWidth: 3,
    borderBottomWidth: 3 + PRIMARY_DROP,
  },
  secondaryFace: { backgroundColor: "#FFFFFF", borderWidth: 5 },
  secondaryBase: {
    position: "absolute",
    left: 0,
    right: 0,
    backgroundColor: GAME_COLORS.ink,
  },
  innerShade: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 5,
    backgroundColor: "rgba(7, 60, 29, 0.35)",
  },
  gel: { position: "absolute" },
  gelPrimary: { backgroundColor: "rgba(255, 255, 255, 0.28)" },
  gelSecondary: { backgroundColor: "#FFFFFF" },
  gelTopOpacity: { opacity: 0.65 },
  gelLeftOpacity: { opacity: 0.4 },
  label: { fontFamily: FONTS.button, textAlign: "center" },
  primaryLabel: {
    color: "#FFFFFF",
    textShadowColor: GAME_COLORS.ink,
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 1,
  },
  secondaryLabel: { color: GAME_COLORS.ink },
});
