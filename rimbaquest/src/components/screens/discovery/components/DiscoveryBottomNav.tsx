import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Tap } from "../../../common/Tap";
import { PrimaryButton } from "../../../common/PrimaryButton";

// Shared Back / Next (or Confirm) footer used by every step of the
// discovery flow.
export function DiscoveryBottomNav({
  onBack,
  backLabel = "Back",
  backDisabled,
  nextLabel,
  onNext,
  nextDisabled,
}: {
  onBack: () => void;
  backLabel?: string;
  backDisabled?: boolean;
  nextLabel: string;
  onNext: () => void;
  nextDisabled?: boolean;
}) {
  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        <Tap
          label={backLabel}
          style={[styles.backBtn, backDisabled && styles.disabled]}
          disabled={backDisabled}
          onPress={onBack}
        >
          <Text style={styles.backText}>{backLabel}</Text>
        </Tap>
        <PrimaryButton
          label={nextLabel}
          disabled={nextDisabled}
          style={styles.nextBtn}
          onPress={onNext}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: "100%",
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
  },
  row: { flexDirection: "row", alignItems: "center", gap: 12, width: "100%" },
  backBtn: {
    width: 120,
    height: 52,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: "#0A4D26",
    alignItems: "center",
    justifyContent: "center",
  },
  backText: { color: "#0A4D26", fontSize: 16, fontWeight: "800" },
  nextBtn: { flex: 1 },
  disabled: { opacity: 0.45 },
});
