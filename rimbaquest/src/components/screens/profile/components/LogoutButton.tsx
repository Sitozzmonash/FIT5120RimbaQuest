import React from "react";
import { StyleSheet } from "react-native";
import { PrimaryButton } from "../../../common/PrimaryButton";

export function LogoutButton({ onPress }: { onPress: () => void }) {
  return (
    <PrimaryButton label="Log Out" style={styles.button} onPress={onPress} />
  );
}

const styles = StyleSheet.create({
  button: { marginTop: 24 },
});
