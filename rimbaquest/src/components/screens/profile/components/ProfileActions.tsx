import React from "react";
import { StyleSheet, Text } from "react-native";
import { useNavigationStore } from "../../../../store/useNavigationStore";
import { useProfileEditStore } from "../../../../store/useProfileEditStore";
import { useUserStore } from "../../../../store/useUserStore";
import { Tap } from "../../../common/Tap";
import { PrimaryButton } from "../../../common/PrimaryButton";

function openEdit() {
  useProfileEditStore
    .getState()
    .startEditing(useUserStore.getState().currentUser);
  useNavigationStore.getState().open("profile_edit");
}

export function ProfileActions() {
  return (
    <>
      <PrimaryButton
        label="Edit Profile"
        style={styles.primary}
        onPress={openEdit}
      />
      <Tap
        label="Log Out"
        style={styles.secondary}
        onPress={() => useUserStore.getState().logout()}
      >
        <Text style={styles.secondaryText}>Log Out</Text>
      </Tap>
    </>
  );
}

const styles = StyleSheet.create({
  primary: { marginTop: 24 },
  secondary: {
    minHeight: 50,
    marginTop: 10,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: "#C8D1CA",
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryText: { color: "#566159", fontSize: 14, fontWeight: "800" },
});
