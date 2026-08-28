import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Tap } from "../../../common/Tap";

// Shared Back / Next (or Confirm) footer used by every step of the
// discovery flow.
export function DiscoveryBottomNav({
  onBack,
  backLabel = "Back",
  nextLabel,
  onNext,
  nextDisabled,
}: {
  onBack: () => void;
  backLabel?: string;
  nextLabel: string;
  onNext: () => void;
  nextDisabled?: boolean;
}) {
  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        <Tap label={backLabel} style={styles.backBtn} onPress={onBack}>
          <Text style={styles.backText}>{backLabel}</Text>
        </Tap>
        <Tap
          label={nextLabel}
          style={[styles.nextBtn, nextDisabled && styles.disabled]}
          disabled={nextDisabled}
          onPress={onNext}
        >
          <Text style={styles.nextText}>{nextLabel}</Text>
        </Tap>
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
  nextBtn: {
    flex: 1,
    height: 52,
    borderRadius: 999,
    backgroundColor: "#0A4D26",
    alignItems: "center",
    justifyContent: "center",
  },
  nextText: { color: "#FFFFFF", fontSize: 16, fontWeight: "900" },
  disabled: { opacity: 0.45 },
});
