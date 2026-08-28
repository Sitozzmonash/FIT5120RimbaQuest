import React from "react";
import { StyleSheet, Text } from "react-native";
import { Tap } from "../../../common/Tap";

export function LogoutButton({ onPress }: { onPress: () => void }) {
  return (
    <Tap label="Log Out" style={styles.button} onPress={onPress}>
      <Text style={styles.text}>Log Out</Text>
    </Tap>
  );
}

const styles = StyleSheet.create({
  button: {
    height: 50,
    marginTop: 24,
    borderRadius: 25,
    backgroundColor: "#0A4D26",
    alignItems: "center",
    justifyContent: "center",
  },
  text: { color: "#FFFFFF", fontSize: 15, fontWeight: "800" },
});
