import React from "react";
import { StyleSheet, View } from "react-native";
import { WoodPlank } from "../../../common/game/WoodPlank";
import { DISCOVERY_COLORS } from "./discoveryTheme";

export function PlankSection({
  title,
  background = "#FFFFFF",
  children,
}: {
  title: string;
  background?: string;
  children: React.ReactNode;
}) {
  return (
    <View style={[styles.box, { backgroundColor: background }]}>
      <WoodPlank title={title} />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    alignSelf: "stretch",
    borderWidth: 3,
    borderBottomWidth: 7,
    borderColor: DISCOVERY_COLORS.ink,
    borderRadius: 16,
    overflow: "hidden",
  },
});
