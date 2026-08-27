import React from "react";
import { StyleSheet, Text, View } from "react-native";

const STEPS: { n: 1 | 2 | 3 | 4; label: string }[] = [
  { n: 1, label: "Capture" },
  { n: 2, label: "Category" },
  { n: 3, label: "Species" },
  { n: 4, label: "Review" },
];

export function DiscoveryStepIndicator({
  step,
  variant = "light",
}: {
  step: 1 | 2 | 3 | 4;
  variant?: "light" | "dark";
}) {
  const dark = variant === "dark";
  return (
    <View style={[styles.wrap, dark && styles.wrapDark]}>
      <View style={styles.row}>
        {STEPS.map((item, i) => {
          const state =
            item.n < step ? "done" : item.n === step ? "active" : "upcoming";
          return (
            <React.Fragment key={item.n}>
              <View style={styles.item}>
                <View
                  style={[
                    styles.circle,
                    dark ? styles.circleUpcomingDark : styles.circleUpcoming,
                    state !== "upcoming" &&
                      (dark ? styles.circleActiveDark : styles.circleActive),
                    state === "active" && styles.circleBig,
                  ]}
                >
                  <Text
                    style={[
                      styles.number,
                      dark ? styles.numberDark : styles.numberUpcoming,
                      state !== "upcoming" && styles.numberActive,
                    ]}
                  >
                    {item.n}
                  </Text>
                </View>
                <Text
                  style={[
                    styles.label,
                    dark ? styles.labelDark : styles.labelLight,
                    state === "active" && styles.labelActive,
                  ]}
                >
                  {item.label}
                </Text>
              </View>
              {i < STEPS.length - 1 && (
                <View
                  style={[
                    styles.line,
                    dark ? styles.lineDark : styles.lineLight,
                    item.n < step &&
                      (dark ? styles.lineDoneDark : styles.lineDone),
                  ]}
                />
              )}
            </React.Fragment>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { width: "100%" },
  wrapDark: { paddingHorizontal: 24, paddingVertical: 12 },
  row: { flexDirection: "row", alignItems: "center", width: "100%" },
  item: { flex: 1, alignItems: "center", gap: 6, minWidth: 0 },
  circle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  circleBig: { width: 32, height: 32, borderRadius: 16 },
  circleUpcoming: { backgroundColor: "#E2ECE4" },
  circleActive: { backgroundColor: "#0A4D26" },
  circleUpcomingDark: { backgroundColor: "rgba(255,255,255,0.25)" },
  circleActiveDark: { backgroundColor: "#78B833" },
  number: { fontSize: 14, fontWeight: "800" },
  numberUpcoming: { color: "#173F6B" },
  numberActive: { color: "#FFFFFF" },
  numberDark: { color: "#FFFFFF" },
  label: { fontSize: 12, fontWeight: "700" },
  labelLight: { color: "#1A1A1A" },
  labelDark: { color: "#FFFFFF" },
  labelActive: { fontWeight: "800" },
  line: { height: 2, width: 24, borderRadius: 1 },
  lineLight: { backgroundColor: "#D8EDD8" },
  lineDone: { backgroundColor: "#0A4D26" },
  lineDark: { backgroundColor: "rgba(255,255,255,0.4)" },
  lineDoneDark: { backgroundColor: "rgba(255,255,255,0.4)" },
});
