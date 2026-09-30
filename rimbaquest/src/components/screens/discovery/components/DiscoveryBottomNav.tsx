import React from "react";
import { StyleSheet, View } from "react-native";
import { GameButton } from "../../../common/game/GameButton";

export function DiscoveryBottomNav({
  onBack,
  backLabel = "Back",
  backDisabled,
  nextLabel,
  onNext,
  nextDisabled,
  nextLoading,
}: {
  onBack: () => void;
  backLabel?: string;
  backDisabled?: boolean;
  nextLabel: string;
  onNext: () => void;
  nextDisabled?: boolean;
  nextLoading?: boolean;
}) {
  return (
    <View style={styles.row}>
      <GameButton
        label={backLabel}
        variant="secondary"
        width="hug"
        style={styles.back}
        disabled={backDisabled}
        onPress={onBack}
      />
      <GameButton
        label={nextLabel}
        width="hug"
        style={styles.next}
        disabled={nextDisabled}
        loading={nextLoading}
        onPress={onNext}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "flex-end", gap: 12, width: "100%" },
  back: { width: 120 },
  next: { flex: 1 },
});
