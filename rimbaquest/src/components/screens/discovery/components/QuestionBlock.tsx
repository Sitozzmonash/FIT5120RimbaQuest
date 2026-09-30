import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { FONTS } from "../../../../constants/fonts";
import { DISCOVERY_COLORS } from "./discoveryTheme";

export function QuestionBlock({ children }: { children: React.ReactNode }) {
  return (
    <View style={styles.block}>
      <Text style={styles.text}>{children}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  block: {
    alignSelf: "stretch",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: DISCOVERY_COLORS.paper,
    borderWidth: 3,
    borderBottomWidth: 8,
    borderColor: DISCOVERY_COLORS.ink,
    borderRadius: 18,
  },
  text: {
    fontFamily: FONTS.display,
    color: DISCOVERY_COLORS.heading,
    fontSize: 19,
    lineHeight: 23,
    textAlign: "center",
  },
});
