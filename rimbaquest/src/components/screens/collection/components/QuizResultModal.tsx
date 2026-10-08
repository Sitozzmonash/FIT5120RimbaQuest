import React from "react";
import { StyleSheet, Text } from "react-native";
import { FONTS } from "../../../../constants/fonts";
import { useAbilityQuizStore } from "../../../../store/useAbilityQuizStore";
import { WoodModal } from "../../../common/game/WoodModal";
import { Tap } from "../../../common/Tap";

export function QuizResultModal() {
  const result = useAbilityQuizStore((state) => state.result);
  const reviewing = useAbilityQuizStore((state) => state.reviewing);
  const slot = useAbilityQuizStore((state) => state.pendingSlot);
  const quiz = useAbilityQuizStore.getState;
  const passed = Boolean(result?.passed);
  const score = `You got ${result?.score ?? 0} out of ${result?.total ?? 0} right.`;
  const canReview = Boolean(result?.review?.length);

  return passed ? (
    <WoodModal
      visible={Boolean(result) && !reviewing}
      icon="check"
      positive
      title="You Did It!"
      message={`${score} ${
        slot === 3
          ? "You earned a new 4-Energy special move for battle!"
          : "You earned a new special move!"
      }`}
      actionLabel={canReview ? "Review Questions" : "Continue"}
      onAction={() => canReview ? quiz().startReview() : quiz().finishQuiz()}
      secondaryLabel={canReview ? "Continue" : undefined}
      onSecondary={canReview ? () => quiz().finishQuiz() : undefined}
    />
  ) : (
    <WoodModal
      visible={Boolean(result) && !reviewing}
      icon="alert"
      positive={false}
      title="Almost There!"
      message={`${score} Try again and get every answer right to earn this ability.`}
      actionLabel={canReview ? "Review Questions" : "Try Again"}
      onAction={() => canReview ? quiz().startReview() : quiz().retryQuiz()}
      secondaryLabel={canReview ? "Try Again" : "Leave Quiz"}
      onSecondary={() => canReview ? quiz().retryQuiz() : quiz().finishQuiz()}
    >
      {canReview ? (
        <Tap label="Leave quiz" onPress={() => quiz().finishQuiz()} style={styles.leave}>
          <Text style={styles.leaveText}>Leave Quiz</Text>
        </Tap>
      ) : null}
    </WoodModal>
  );
}

const styles = StyleSheet.create({
  leave: { paddingVertical: 6 },
  leaveText: { fontFamily: FONTS.bodyBlack, fontSize: 14, color: "#6B5B45" },
});
