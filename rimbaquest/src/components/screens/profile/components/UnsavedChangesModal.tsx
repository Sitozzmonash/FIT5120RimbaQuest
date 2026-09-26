import React from "react";
import { WoodModal } from "../../../common/game/WoodModal";

export function UnsavedChangesModal({
  visible,
  onCancel,
  onConfirm,
}: {
  visible: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <WoodModal
      visible={visible}
      onRequestClose={onCancel}
      icon="alert"
      positive={false}
      title="Your Changes Are Not Saved"
      message="Do you want to leave without saving what you changed?"
      actionLabel="Stay Here"
      onAction={onCancel}
      secondaryLabel="Leave Anyway"
      secondaryVariant="danger"
      onSecondary={onConfirm}
    />
  );
}
