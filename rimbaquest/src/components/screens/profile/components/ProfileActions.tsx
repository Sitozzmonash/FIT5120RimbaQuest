import React, { useState } from "react";
import { StyleSheet, View } from "react-native";
import { useNavigationStore } from "../../../../store/useNavigationStore";
import { useProfileEditStore } from "../../../../store/useProfileEditStore";
import { useUserStore } from "../../../../store/useUserStore";
import { GameButton } from "../../../common/game/GameButton";
import { WoodModal } from "../../../common/game/WoodModal";

function openEdit() {
  useProfileEditStore
    .getState()
    .startEditing(useUserStore.getState().currentUser);
  useNavigationStore.getState().open("profile_edit");
}

export function ProfileActions() {
  const [confirmingLogout, setConfirmingLogout] = useState(false);

  return (
    <View style={styles.actions}>
      <GameButton label="Edit Profile" onPress={openEdit} size="m" />
      <GameButton
        label="Log Out"
        variant="secondary"
        onPress={() => setConfirmingLogout(true)}
      />
      <WoodModal
        visible={confirmingLogout}
        onRequestClose={() => setConfirmingLogout(false)}
        icon="alert"
        positive={false}
        title="Log out?"
        message="Do you want to log out? Your animals will be here when you log back in."
        actionLabel="Stay"
        onAction={() => setConfirmingLogout(false)}
        secondaryLabel="Log Out"
        secondaryVariant="danger"
        onSecondary={() => {
          setConfirmingLogout(false);
          useUserStore.getState().logout();
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  actions: { gap: 4 },
});
