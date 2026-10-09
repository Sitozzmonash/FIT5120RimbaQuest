import React from "react";
import { StyleSheet, Text } from "react-native";
import { FONTS } from "../../../constants/fonts";
import { Tap } from "../../common/Tap";
import { AUTH_COLORS } from "./authTheme";

// Bold underlined text link
export function AuthLink({
  label,
  onPress,
}: {
  label: string;
  onPress: () => void;
}) {
  return (
    <Tap label={label} style={{}} onPress={onPress}>
      <Text style={styles.text}>{label}</Text>
    </Tap>
  );
}

const styles = StyleSheet.create({
  text: {
    fontFamily: FONTS.bodyBlack,
    color: AUTH_COLORS.link,
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
    textDecorationLine: "underline",
  },
});
