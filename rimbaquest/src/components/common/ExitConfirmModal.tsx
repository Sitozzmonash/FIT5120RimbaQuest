import React from "react";
import { WoodModal } from "./game/WoodModal";

export function ExitConfirmModal({
  visible,
  onStay,
  onLeave,
}: {
  visible: boolean;
  onStay: () => void;
  onLeave: () => void;
}) {
  return (
    <WoodModal
      visible={visible}
      onRequestClose={onStay}
      icon="alert"
      positive={false}
      title="Leave RimbaQuest?"
      message="Are you sure you want to exit the app?"
      actionLabel="Stay"
      onAction={onStay}
      secondaryLabel="Leave"
      secondaryVariant="danger"
      onSecondary={onLeave}
    />
  );
}
