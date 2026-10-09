import React, { useState } from "react";
import { useNavigationStore } from "../../../../store/useNavigationStore";
import { GameScreenHeader } from "../../../common/game/GameScreenHeader";
import { DiscardPhotoModal } from "./DiscardPhotoModal";

export function DiscoveryHeader({
  title,
  confirmDiscard = false,
  onDiscard,
  disabled = false,
}: {
  title: string;
  confirmDiscard?: boolean;
  onDiscard?: () => void;
  disabled?: boolean;
}) {
  const [confirming, setConfirming] = useState(false);
  const goBack = () => useNavigationStore.getState().goBack();

  return (
    <>
      <GameScreenHeader
        title={title}
        disabled={disabled}
        onBack={() => (confirmDiscard ? setConfirming(true) : goBack())}
      />

      {confirmDiscard && (
        <DiscardPhotoModal
          visible={confirming}
          onCancel={() => setConfirming(false)}
          onConfirm={() => {
            setConfirming(false);
            (onDiscard ?? goBack)();
          }}
        />
      )}
    </>
  );
}
