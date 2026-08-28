import React from "react";
import { StyleSheet, Text, View } from "react-native";

const TAPE_TEXT = "UNDISCOVERED   UNDISCOVERED   UNDISCOVERED";

export function UndiscoveredTape() {
  return (
    <View style={styles.tapeOverlay} pointerEvents="none">
      <View style={[styles.tapeRow, { top: "68%" }]}>
        <View style={styles.tapeStrip}>
          <Text style={styles.tapeStripText} numberOfLines={1}>
            {TAPE_TEXT}
          </Text>
        </View>
      </View>
      <View style={[styles.tapeRow, { top: "102%" }]}>
        <View style={styles.tapeStrip}>
          <Text style={styles.tapeStripText} numberOfLines={1}>
            {TAPE_TEXT}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  tapeOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.15)",
    overflow: "hidden",
  },
  tapeRow: {
    position: "absolute",
    left: "-30%",
    width: "160%",
    alignItems: "center",
    transform: [{ rotate: "25deg" }],
  },
  tapeStrip: {
    width: "100%",
    backgroundColor: "#C6AA50",
    borderWidth: 1.5,
    borderColor: "#262626",
    paddingVertical: 4,
    alignItems: "center",
    justifyContent: "center",
  },
  tapeStripText: {
    color: "#1A1A1A",
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 1.6,
    textAlign: "center",
  },
});
