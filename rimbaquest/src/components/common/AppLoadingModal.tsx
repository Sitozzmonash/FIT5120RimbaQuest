import React from "react";
import { ActivityIndicator, StyleSheet } from "react-native";
import { useUserStore } from "../../store/useUserStore";
import { WoodModal } from "./game/WoodModal";

const EXPLORER_HAT = require("../../../assets/collection/chat-explorer-hat.png");

export function AppLoadingModal() {
  const loading = useUserStore((state) => state.profileLoading);

  return (
    <WoodModal
      visible={loading}
      icon={EXPLORER_HAT}
      positive
      stars={false}
      title="Getting Your Adventure Ready!"
      message="Gathering your animal cards..."
    >
      <ActivityIndicator size="large" color="#3F9A4E" style={styles.spinner} />
    </WoodModal>
  );
}

const styles = StyleSheet.create({
  spinner: { marginTop: 4 },
});
