import React from "react";
import { StyleSheet, Text, View } from "react-native";

export function QuizStepIndicator({
  total,
  current,
}: {
  total: number;
  current: number;
}) {
  const steps = Array.from({ length: total }, (_, i) => i + 1);

  return (
    <View style={styles.row}>
      {steps.map((step, i) => {
        const isActive = step === current;
        const isDone = step < current;
        return (
          <React.Fragment key={step}>
            <View style={[styles.circle, isActive && styles.circleActive]}>
              <Text style={[styles.number, isActive && styles.numberActive]}>
                {step}
              </Text>
            </View>
            {i < steps.length - 1 && (
              <View
                style={[styles.connector, isDone && styles.connectorDone]}
              />
            )}
          </React.Fragment>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  circle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#E8F2E0",
  },
  circleActive: { backgroundColor: "#0A4D26" },
  number: { fontSize: 14, fontWeight: "800", color: "#78B833" },
  numberActive: { color: "#FFFFFF" },
  connector: { flex: 1, height: 3, minWidth: 4, backgroundColor: "#C8E6C9" },
  connectorDone: { backgroundColor: "#0A4D26" },
});
