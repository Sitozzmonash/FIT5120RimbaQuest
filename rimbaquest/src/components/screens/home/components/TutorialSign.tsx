import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { ScaleTap } from "../../../common/ScaleTap";
import { HOME_COLORS, signTextStyle } from "../homeTheme";
import { WoodenSign } from "./WoodenSign";

export function TutorialSign({ onPress }: { onPress: () => void }) {
  return (
    <ScaleTap label="Start home map tutorial" style={styles.root} onPress={onPress}>
      <View style={styles.post} />
      <WoodenSign style={styles.sign}>
        <Text style={styles.text}>? TUTORIAL</Text>
      </WoodenSign>
    </ScaleTap>
  );
}

const styles = StyleSheet.create({
  root: { position: "absolute", left: 244, top: 125, width: 132, height: 65, alignItems: "center" },
  post: {
    position: "absolute", top: 26, width: 12, height: 38,
    backgroundColor: "#8A5220", borderWidth: 3, borderColor: HOME_COLORS.ink,
    borderRadius: 4,
  },
  sign: { paddingHorizontal: 9, paddingVertical: 7 },
  text: { ...signTextStyle, fontSize: 13 },
});
