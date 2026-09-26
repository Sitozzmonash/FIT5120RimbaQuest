import React from "react";
import { Image, StyleSheet, View } from "react-native";
import { HOME_MAP_IMAGES } from "../../../../constants/images";
import { HOME_COLORS } from "../homeTheme";
import {
  MAP_CLEARINGS,
  MAP_DECOR,
  MAP_GRASS_PATCHES,
  MAP_TRAIL,
} from "../homeMapLayout";

// Non-interactive map ground: clearings, grass, the dotted trail and props.
export function MapScenery() {
  return (
    <View style={[StyleSheet.absoluteFill, { pointerEvents: "none" }]}>
      {MAP_CLEARINGS.map(({ cx, cy, r, color }) => (
        <View
          key={`${cx}-${cy}`}
          style={[
            styles.clearing,
            {
              left: cx - r,
              top: cy - r,
              width: r * 2,
              height: r * 2,
              backgroundColor: color,
            },
          ]}
        />
      ))}
      {MAP_GRASS_PATCHES.map((patch) => (
        <Image
          key={`${patch.left}-${patch.top}`}
          source={HOME_MAP_IMAGES.grassPatch}
          style={[styles.absolute, patch]}
          resizeMode="stretch"
        />
      ))}
      {MAP_TRAIL.map(([left, top]) => (
        <View
          key={`${left}-${top}`}
          style={[styles.trailStone, { left, top }]}
        />
      ))}
      {MAP_DECOR.map(({ source, rotate, ...placement }) => (
        <Image
          key={`${placement.left}-${placement.top}`}
          source={source}
          style={[
            styles.absolute,
            placement,
            rotate ? { transform: [{ rotate }] } : null,
          ]}
          resizeMode="stretch"
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  absolute: { position: "absolute" },
  clearing: { position: "absolute", borderRadius: 999 },
  trailStone: {
    position: "absolute",
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: HOME_COLORS.ink,
    backgroundColor: HOME_COLORS.wood,
  },
});
