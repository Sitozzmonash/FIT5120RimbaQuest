import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { Tap } from "../../../common/Tap";

// Shared Back / Next button row for a step's footer actions.
export function StepNav({
  onBack,
  nextLabel,
  onNext,
  nextDisabled,
}: {
  onBack: () => void;
  nextLabel: string;
  onNext: () => void;
  nextDisabled?: boolean;
}) {
  return (
    <View style={styles.createNavButtonsRow}>
      <Tap
        label="Back"
        style={[styles.createSecondaryBtn, styles.createNavButtonFlex]}
        onPress={onBack}
      >
        <MaterialIcons name="chevron-left" size={20} color="#0A4D26" />
        <Text style={styles.createSecondaryBtnText}>Back</Text>
      </Tap>
      <Tap
        label={nextLabel}
        style={[
          styles.createCtaBtn,
          styles.createNavButtonFlex,
          nextDisabled && styles.buttonDisabled,
        ]}
        disabled={nextDisabled}
        onPress={onNext}
      >
        <Text style={styles.createCtaBtnText}>{nextLabel}</Text>
      </Tap>
    </View>
  );
}

const styles = StyleSheet.create({
  createNavButtonsRow: { flexDirection: "row", gap: 12, width: "100%" },
  createNavButtonFlex: { flex: 1 },
  createCtaBtn: {
    borderRadius: 20,
    backgroundColor: "#0A4D26",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    shadowColor: "#0A4D26",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  createCtaBtnText: { color: "#FFFFFF", fontSize: 18, fontWeight: "900" },
  createSecondaryBtn: {
    flexDirection: "row",
    gap: 4,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    borderWidth: 1.5,
    borderColor: "#0A4D26",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
  },
  createSecondaryBtnText: { color: "#0A4D26", fontSize: 16, fontWeight: "800" },
  buttonDisabled: { opacity: 0.5 },
});
