import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";

const STEPS: { n: 1 | 2 | 3; label: string }[] = [
  { n: 1, label: "Account" },
  { n: 2, label: "Age" },
  { n: 3, label: "Password" },
];

// Top-of-screen "Account → Age → Password" progress tracker for the
// account-creation flow's 3 steps.
export function StepIndicator({ step }: { step: 1 | 2 | 3 }) {
  return (
    <View style={styles.createStepIndicator}>
      {STEPS.map((item, i) => {
        const state =
          item.n < step ? "done" : item.n === step ? "active" : "upcoming";
        return (
          <React.Fragment key={item.n}>
            <View style={styles.createStepItem}>
              <View
                style={[
                  styles.createStepCircle,
                  state === "active" && styles.createStepCircleActive,
                  state === "done" && styles.createStepCircleDone,
                ]}
              >
                {state === "done" ? (
                  <MaterialIcons name="check" size={14} color="#FFFFFF" />
                ) : (
                  <Text
                    style={[
                      styles.createStepNumber,
                      state === "active" && styles.createStepNumberActive,
                    ]}
                  >
                    {item.n}
                  </Text>
                )}
              </View>
              <Text
                style={[
                  styles.createStepLabel,
                  state !== "upcoming" && styles.createStepLabelActive,
                ]}
              >
                {item.label}
              </Text>
            </View>
            {i < STEPS.length - 1 && (
              <View
                style={[
                  styles.createStepLine,
                  item.n < step && styles.createStepLineDone,
                ]}
              />
            )}
          </React.Fragment>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  createStepIndicator: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "center",
    paddingVertical: 4,
  },
  createStepItem: { alignItems: "center", gap: 6, width: 68 },
  createStepCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: "#D8EDD8",
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  createStepCircleActive: { borderColor: "#0A4D26" },
  createStepCircleDone: { borderColor: "#0A4D26", backgroundColor: "#0A4D26" },
  createStepNumber: { fontSize: 13, fontWeight: "800", color: "#9AB8A6" },
  createStepNumberActive: { color: "#0A4D26" },
  createStepLabel: { fontSize: 11, fontWeight: "700", color: "#9AB8A6" },
  createStepLabelActive: { color: "#0A4D26" },
  createStepLine: {
    width: 28,
    height: 2,
    backgroundColor: "#D8EDD8",
    marginTop: 13,
  },
  createStepLineDone: { backgroundColor: "#0A4D26" },
});
