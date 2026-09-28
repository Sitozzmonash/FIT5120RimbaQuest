import React from "react";
import { StyleSheet } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { ScaleTap } from "../../../common/ScaleTap";
import { DISCOVERY_COLORS } from "./discoveryTheme";

export function PeekToggle({
  peeking,
  onToggle,
}: {
  peeking: boolean;
  onToggle: () => void;
}) {
  return (
    <ScaleTap
      label={
        peeking ? "Show the choices again" : "Hide the choices to see my photo"
      }
      style={styles.button}
      onPress={onToggle}
    >
      <MaterialIcons
        name={peeking ? "visibility" : "visibility-off"}
        size={26}
        color="#FFFFFF"
      />
    </ScaleTap>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 50,
    height: 50,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    backgroundColor: DISCOVERY_COLORS.green,
    borderRadius: 25,
  },
});
