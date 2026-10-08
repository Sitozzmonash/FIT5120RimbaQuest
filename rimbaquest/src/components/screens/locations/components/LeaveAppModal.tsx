import React from "react";
import { WoodModal } from "../../../common/game/WoodModal";

export type LeaveTarget = "maps" | "website";

const COPY: Record<LeaveTarget, { destination: string; actionLabel: string }> =
  {
    maps: { destination: "Google Maps", actionLabel: "Open Maps" },
    website: { destination: "the park's website", actionLabel: "Open Website" },
  };

export function LeaveAppModal({
  target,
  onConfirm,
  onCancel,
}: {
  target: LeaveTarget | null;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const copy = COPY[target ?? "maps"];

  return (
    <WoodModal
      visible={target !== null}
      onRequestClose={onCancel}
      icon="alert"
      positive
      stars={false}
      title="Leaving RimbaQuest"
      message={`You're about to leave RimbaQuest and open ${copy.destination}.`}
      actionLabel={copy.actionLabel}
      onAction={onConfirm}
      secondaryLabel="Stay Here"
      onSecondary={onCancel}
    />
  );
}
