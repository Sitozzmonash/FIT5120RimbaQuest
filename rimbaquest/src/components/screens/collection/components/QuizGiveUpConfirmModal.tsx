import React from "react";
import { useAbilityQuizStore } from "../../../../store/useAbilityQuizStore";
import { WoodModal } from "../../../common/game/WoodModal";

export function QuizGiveUpConfirmModal() {
  const visible = useAbilityQuizStore((state) => state.giveUpConfirmVisible);
  const quiz = useAbilityQuizStore.getState;

  return (
    <WoodModal
      visible={visible}
      onRequestClose={() => quiz().closeGiveUpConfirm()}
      icon="alert"
      positive={false}
      title="Stop this quiz?"
      message="Your answers will be lost, and you will not earn the special move."
      actionLabel="Keep Answering"
      onAction={() => quiz().closeGiveUpConfirm()}
      secondaryLabel="Yes, Stop"
      secondaryVariant="danger"
      onSecondary={() => quiz().giveUp()}
    />
  );
}
