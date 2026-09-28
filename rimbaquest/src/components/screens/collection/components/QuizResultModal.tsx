import React from "react";
import { useAbilityQuizStore } from "../../../../store/useAbilityQuizStore";
import { WoodModal } from "../../../common/game/WoodModal";

export function QuizResultModal() {
  const result = useAbilityQuizStore((state) => state.result);
  const slot = useAbilityQuizStore((state) => state.pendingSlot);
  const quiz = useAbilityQuizStore.getState;
  const passed = Boolean(result?.passed);
  const score = `You got ${result?.score ?? 0} out of ${result?.total ?? 0} right.`;

  return passed ? (
    <WoodModal
      visible={Boolean(result)}
      icon="check"
      positive
      title="You Did It!"
      message={`${score} ${
        slot === 3
          ? "You earned a new 4-Energy special move for battle!"
          : "You earned a new special move!"
      }`}
      actionLabel="Continue"
      onAction={() => quiz().finishQuiz()}
    />
  ) : (
    <WoodModal
      visible={Boolean(result)}
      icon="alert"
      positive={false}
      title="Almost There!"
      message={`${score} Try again and get every answer right to earn this ability.`}
      actionLabel="Try Again"
      onAction={() => quiz().retryQuiz()}
      secondaryLabel="Leave Quiz"
      onSecondary={() => quiz().finishQuiz()}
    />
  );
}
