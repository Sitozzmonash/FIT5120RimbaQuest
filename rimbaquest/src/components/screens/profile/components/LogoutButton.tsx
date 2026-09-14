import React from "react";
import { StyleSheet } from "react-native";
import { useUserStore } from "../../../../store/useUserStore";
import { PrimaryButton } from "../../../common/PrimaryButton";

export function LogoutButton() {
  return (
    <PrimaryButton
      label="Log Out"
      style={styles.button}
      onPress={() => useUserStore.getState().logout()}
    />
  );
}

const styles = StyleSheet.create({
  button: { marginTop: 24 },
});
