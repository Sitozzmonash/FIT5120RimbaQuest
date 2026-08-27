import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { AgeWheelPicker } from "./AgeWheelPicker";
import { StepNav } from "./StepNav";

// Step 2 of account creation: pick an age via the scrollable wheel.
export function AgeStep({
  value,
  onChange,
  error,
  onBack,
  onNext,
}: {
  value: number;
  onChange: (n: number) => void;
  error?: string;
  onBack: () => void;
  onNext: () => void;
}) {
  return (
    <View style={styles.createStepBody}>
      <Text style={styles.createAgeHeading}>How old are you?</Text>
      <Text style={styles.createAgeSubtext}>Scroll to pick your age.</Text>
      <AgeWheelPicker value={value} onChange={onChange} />
      {error && <Text style={styles.createFieldError}>{error}</Text>}

      <View style={styles.createActions}>
        <StepNav onBack={onBack} nextLabel="Next" onNext={onNext} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  createStepBody: { gap: 16 },
  createAgeHeading: {
    color: "#0A4D26",
    fontSize: 18,
    fontWeight: "800",
    textAlign: "center",
  },
  createAgeSubtext: {
    color: "#2D5A3E",
    fontSize: 13,
    textAlign: "center",
    marginBottom: 8,
  },
  createFieldError: { color: "#D9383A", fontSize: 11, fontWeight: "700" },
  createActions: {
    gap: 12,
    alignItems: "center",
    paddingTop: 6,
    width: "100%",
  },
});
