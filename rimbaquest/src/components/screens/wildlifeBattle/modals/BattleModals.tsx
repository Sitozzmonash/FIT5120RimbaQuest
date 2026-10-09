import React from "react";
import { ActivityIndicator, Text } from "react-native";
import { GAME_COLORS } from "../../../common/game/gameTheme";
import { WoodModal } from "../../../common/game/WoodModal";
import { WildlifeMode } from "../../../../types/wildlifeMatch";
import { errorTextStyle } from "../shared/ErrorNote";

const EXPLORER_HAT = require("../../../../../assets/collection/chat-explorer-hat.png");

export function GiveUpModal({
  visible,
  mode,
  leaving,
  error,
  onConfirm,
  onKeepPlaying,
}: {
  visible: boolean;
  mode: WildlifeMode | undefined;
  leaving: boolean;
  error: string | null;
  onConfirm: () => void;
  onKeepPlaying: () => void;
}) {
  return (
    <WoodModal
      visible={visible}
      onRequestClose={onKeepPlaying}
      icon="alert"
      positive={false}
      stars={false}
      title="Give Up?"
      message={
        mode === "bot"
          ? "Giving up counts as a loss, and your card will rest for 2 hours."
          : "Giving up counts as a loss and costs 3 leaderboard points. Your card will rest for 2 hours."
      }
      actionLabel="Give Up"
      actionVariant="danger"
      actionLoading={leaving}
      onAction={onConfirm}
      secondaryLabel="Keep Playing"
      onSecondary={onKeepPlaying}
    >
      {visible && error ? <Text style={errorTextStyle}>{error}</Text> : null}
    </WoodModal>
  );
}

export function RecoveryModal({
  visible,
  recovering,
  error,
  onRetry,
  onBack,
  onClose,
}: {
  visible: boolean;
  recovering: boolean;
  error: string | null;
  onRetry: () => void;
  onBack: () => void;
  onClose: () => void;
}) {
  return (
    <WoodModal
      visible={visible}
      onRequestClose={onClose}
      icon={error ? "alert" : EXPLORER_HAT}
      positive={!error}
      stars={false}
      title={error ? "Couldn't Find Your Match" : "Checking Your Battles!"}
      message={error ?? "Looking for a match you haven't finished..."}
      actionLabel="Try Again"
      onAction={error ? onRetry : undefined}
      secondaryLabel="Back"
      onSecondary={error ? onBack : undefined}
    >
      {recovering ? (
        <ActivityIndicator size="large" color={GAME_COLORS.go} />
      ) : null}
    </WoodModal>
  );
}

/** The host's invite ran out, was canceled, or the friend declined. */
export function MatchEndedModal({
  status,
  onNewMatch,
}: {
  status: "expired" | "canceled" | null;
  onNewMatch: () => void;
}) {
  return (
    <WoodModal
      visible={status !== null}
      onRequestClose={onNewMatch}
      icon="alert"
      positive={false}
      stars={false}
      title={status === "expired" ? "Invitation Expired" : "Match Canceled"}
      message={
        status === "expired"
          ? "Nobody joined within 2 hours. Start a new match to get a fresh code."
          : "This match was canceled, or your friend said not this time. Start a new one whenever you're ready."
      }
      actionLabel="New Match"
      onAction={onNewMatch}
    />
  );
}
