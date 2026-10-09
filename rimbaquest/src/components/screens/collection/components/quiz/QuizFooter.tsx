import React from "react";
import { StyleSheet, View } from "react-native";
import { GameButton } from "../../../../common/game/GameButton";

export function QuizFooter({
  isLastQuestion,
  canContinue,
  submitting,
  onBack,
  onNext,
}: {
  isLastQuestion: boolean;
  canContinue: boolean;
  submitting: boolean;
  onBack: () => void;
  onNext: () => void;
}) {
  return (
    <View style={styles.footer}>
      <GameButton label="Back" variant="secondary" width="hug" style={styles.back} onPress={onBack} />
      <GameButton
        label={isLastQuestion ? "Finish" : "Next"}
        width="hug"
        style={styles.next}
        disabled={!canContinue}
        loading={submitting}
        onPress={onNext}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  footer: { flexDirection: "row", alignItems: "flex-end", gap: 12 },
  back: { width: 120 },
  next: { flex: 1 },
});
