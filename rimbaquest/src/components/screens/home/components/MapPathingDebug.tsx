import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { MAP_OBSTACLES } from "../homeMapLayout";
import { OBSTACLE_PADDING } from "../mapPathing";

// Debug overlay: blocked areas in red, with their padded edge dashed.
// Rendered only when SHOW_MAP_DEBUG is on.
export function MapPathingDebug() {
  return (
    <View style={[StyleSheet.absoluteFill, { pointerEvents: "none" }]}>
      {MAP_OBSTACLES.map((rect, index) => (
        <React.Fragment key={index}>
          <View
            style={[
              styles.padded,
              {
                left: rect.x - OBSTACLE_PADDING,
                top: rect.y - OBSTACLE_PADDING,
                width: rect.w + OBSTACLE_PADDING * 2,
                height: rect.h + OBSTACLE_PADDING * 2,
              },
            ]}
          />
          <View style={[styles.blocked, { left: rect.x, top: rect.y, width: rect.w, height: rect.h }]}>
            <Text style={styles.label}>{rect.label}</Text>
          </View>
        </React.Fragment>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  padded: {
    position: "absolute",
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: "rgba(255, 60, 60, 0.9)",
  },
  blocked: {
    position: "absolute",
    backgroundColor: "rgba(255, 40, 40, 0.22)",
    borderWidth: 2,
    borderColor: "rgba(200, 0, 0, 0.8)",
  },
  label: {
    margin: 2,
    alignSelf: "flex-start",
    paddingHorizontal: 4,
    backgroundColor: "rgba(200, 0, 0, 0.8)",
    color: "#FFFFFF",
    fontSize: 8,
    fontWeight: "700",
  },
});
