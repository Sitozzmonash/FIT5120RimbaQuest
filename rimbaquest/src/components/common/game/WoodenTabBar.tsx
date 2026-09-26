import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { FONTS } from "../../../constants/fonts";
import { ScaleTap } from "../ScaleTap";
import { GAME_COLORS } from "./gameTheme";

const GRAIN_TOPS = [5, 15, 25, 35, 45, 55];

export type WoodenTab<K extends string> = { key: K; label: string };

export function WoodenTabBar<K extends string>({
  tabs,
  active,
  onChange,
}: {
  tabs: WoodenTab<K>[];
  active: K;
  onChange: (key: K) => void;
}) {
  return (
    <View style={styles.bar} accessibilityRole="tablist">
      {GRAIN_TOPS.map((top) => (
        <View key={top} style={[styles.grain, { top }]} />
      ))}
      <View style={styles.highlight} />
      {tabs.map(({ key, label }) => {
        const selected = key === active;
        return (
          <ScaleTap
            key={key}
            label={label}
            style={styles.slot}
            onPress={() => onChange(key)}
          >
            <View
              key={selected ? "active" : "idle"}
              style={[
                styles.face,
                selected ? styles.faceActive : styles.faceIdle,
              ]}
            >
              {selected && <View style={styles.insetShade} />}
              <Text
                style={[styles.label, selected && styles.labelActive]}
                numberOfLines={2}
                adjustsFontSizeToFit
              >
                {label}
              </Text>
            </View>
          </ScaleTap>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    height: 66 + 4,
    paddingHorizontal: 6,
    backgroundColor: GAME_COLORS.wood,
    borderWidth: 3,
    borderBottomWidth: 7,
    borderColor: GAME_COLORS.ink,
    borderRadius: 16,
    overflow: "hidden",
  },
  grain: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: GAME_COLORS.woodLine,
  },
  highlight: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 4,
    backgroundColor: "rgba(255, 255, 255, 0.18)",
  },
  slot: { flex: 1, height: 48 },
  face: {
    position: "absolute",
    left: 0,
    right: 0,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 3,
    borderWidth: 3,
    borderColor: GAME_COLORS.ink,
    borderRadius: 12,
    overflow: "hidden",
  },
  faceIdle: {
    top: 0,
    height: 48,
    borderBottomWidth: 7,
    backgroundColor: GAME_COLORS.paper,
  },
  faceActive: {
    top: 4,
    height: 44,
    borderBottomWidth: 3,
    backgroundColor: GAME_COLORS.goldLight,
  },
  insetShade: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 4,
    backgroundColor: "rgba(7, 60, 29, 0.28)",
  },
  label: {
    fontFamily: FONTS.display,
    color: GAME_COLORS.heading,
    fontSize: 13,
    textAlign: "center",
  },
  labelActive: { color: GAME_COLORS.goldText },
});
