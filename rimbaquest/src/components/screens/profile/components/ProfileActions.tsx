import React from "react";
import { StyleSheet, View } from "react-native";
import { useNavigationStore } from "../../../../store/useNavigationStore";
import { useProfileEditStore } from "../../../../store/useProfileEditStore";
import { useUserStore } from "../../../../store/useUserStore";
import { GameButton } from "../../../common/game/GameButton";

function openEdit() {
  useProfileEditStore
    .getState()
    .startEditing(useUserStore.getState().currentUser);
  useNavigationStore.getState().open("profile_edit");
}

export function ProfileActions() {
  return (
    <View style={styles.actions}>
      <GameButton label="Edit Profile" onPress={openEdit} size="m" />
      <GameButton
        label="Log Out"
        variant="secondary"
        onPress={() => useUserStore.getState().logout()}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  actions: { gap: 4 },
});
