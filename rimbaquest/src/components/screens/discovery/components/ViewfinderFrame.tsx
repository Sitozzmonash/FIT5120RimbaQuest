import React from "react";
import { StyleSheet, View } from "react-native";

export function ViewfinderFrame() {
  return (
    <View style={styles.frame}>
      <View style={[styles.cornerH, styles.cornerTL]} />
      <View style={[styles.cornerV, styles.cornerTL]} />
      <View style={[styles.cornerH, styles.cornerTR]} />
      <View style={[styles.cornerV, styles.cornerTR]} />
      <View style={[styles.cornerH, styles.cornerBL]} />
      <View style={[styles.cornerV, styles.cornerBL]} />
      <View style={[styles.cornerH, styles.cornerBR]} />
      <View style={[styles.cornerV, styles.cornerBR]} />
      <View style={styles.reticleH} />
      <View style={styles.reticleV} />
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    width: 240,
    height: 240,
    alignItems: "flex-start",
    justifyContent: "flex-start",
  },
  cornerH: {
    position: "absolute",
    width: 32,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#FFFFFF",
  },
  cornerV: {
    position: "absolute",
    width: 6,
    height: 32,
    borderRadius: 3,
    backgroundColor: "#FFFFFF",
  },
  cornerTL: { top: 0, left: 0 },
  cornerTR: { top: 0, right: 0 },
  cornerBL: { bottom: 0, left: 0 },
  cornerBR: { bottom: 0, right: 0 },
  reticleH: {
    position: "absolute",
    top: "50%",
    left: "50%",
    width: 80,
    height: 1,
    marginLeft: -40,
    backgroundColor: "#A1E31D",
    opacity: 0.3,
  },
  reticleV: {
    position: "absolute",
    top: "50%",
    left: "50%",
    width: 1,
    height: 80,
    marginTop: -40,
    backgroundColor: "#A1E31D",
    opacity: 0.3,
  },
});
