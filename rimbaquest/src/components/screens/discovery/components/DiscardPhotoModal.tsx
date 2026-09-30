import React from "react";
import { WoodModal } from "../../../common/game/WoodModal";

export function DiscardPhotoModal({
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
      title="Delete this photo?"
      message="Going back will remove this photo. You will need to take or choose it again."
      actionLabel="Keep Photo"
      onAction={onCancel}
      secondaryLabel="Delete & Go Back"
      secondaryVariant="danger"
      onSecondary={onConfirm}
    />
  );
}
