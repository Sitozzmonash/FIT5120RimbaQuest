import React from "react";
import { StyleSheet, View } from "react-native";
import { GameButton } from "../../../common/game/GameButton";

// Shared Back / Next button row for a step's footer actions.
export function StepNav({
  onBack,
  nextLabel,
  onNext,
  nextLoading,
}: {
  onBack: () => void;
  nextLabel: string;
  onNext: () => void;
  nextLoading?: boolean;
}) {
  return (
    <View style={styles.row}>
      <GameButton
        label="Back"
        variant="secondary"
        style={styles.back}
        onPress={onBack}
      />
      <GameButton
        label={nextLabel}
        loading={nextLoading}
        style={styles.next}
        onPress={onNext}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  back: { flex: 2 },
  next: { flex: 3 },
});
