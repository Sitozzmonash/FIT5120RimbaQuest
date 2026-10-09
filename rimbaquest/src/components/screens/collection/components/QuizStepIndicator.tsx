import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { FONTS } from "../../../../constants/fonts";
import { DETAIL_COLORS } from "./detail/detailTheme";

const STEP = 38;
const CURRENT = 50;

export function QuizStepIndicator({
  total,
  current,
}: {
  total: number;
  current: number;
}) {
  const steps = Array.from({ length: total }, (_, i) => i + 1);
  const progress = total > 1 ? (current - 1) / (total - 1) : 0;

  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        <View style={styles.track}>
          <View style={[styles.fill, { width: `${progress * 100}%` }]} />
        </View>
        {steps.map((step) =>
          step < current ? (
            <View key={`${step}-done`} style={[styles.bubble, styles.done]}>
              <MaterialIcons name="check" size={18} color="#FFFFFF" />
            </View>
          ) : step === current ? (
            <View
              key={`${step}-current`}
              style={[styles.bubble, styles.current]}
            >
              {/* <View style={styles.currentShine} /> */}
              <Text style={styles.currentText}>{step}</Text>
            </View>
          ) : (
            <View
              key={`${step}-upcoming`}
              style={[styles.bubble, styles.upcoming]}
            >
              <Text style={styles.upcomingText}>{step}</Text>
            </View>
          ),
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: 34, paddingVertical: 16 },
  row: {
    height: CURRENT + 4,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  track: {
    position: "absolute",
    left: 10,
    right: 10,
    height: 12,
    backgroundColor: DETAIL_COLORS.heading,
    borderWidth: 3,
    borderColor: DETAIL_COLORS.ink,
    borderRadius: 999,
    overflow: "hidden",
  },
  fill: { height: "100%", backgroundColor: "#4CB35A", borderRadius: 999 },
  bubble: {
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: DETAIL_COLORS.ink,
    overflow: "hidden",
  },
  done: {
    width: STEP,
    height: STEP + 3,
    borderRadius: STEP / 2,
    borderBottomWidth: 6,
    backgroundColor: DETAIL_COLORS.green,
  },
  current: {
    width: CURRENT,
    height: CURRENT + 4,
    borderRadius: CURRENT / 2,
    borderBottomWidth: 7,
    backgroundColor: "#FFB938",
  },
  currentShine: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 4,
    backgroundColor: "rgba(255, 255, 255, 0.4)",
  },
  currentText: {
    fontFamily: FONTS.display,
    color: "#FFFFFF",
    fontSize: 22,
    textShadowColor: "#7A3500",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 1,
  },
  upcoming: {
    width: STEP,
    height: STEP,
    borderRadius: STEP / 2,
    backgroundColor: DETAIL_COLORS.paper,
  },
  upcomingText: { fontFamily: FONTS.display, color: "#7C8A78", fontSize: 16 },
});
