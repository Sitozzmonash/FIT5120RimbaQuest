import React from "react";
import { MaterialIcons } from "@expo/vector-icons";
import { StyleSheet } from "react-native";
import { ScreenGuideTopic, useScreenGuideStore } from "../../../store/useScreenGuideStore";
import { ScaleTap } from "../ScaleTap";
import { GAME_COLORS } from "./gameTheme";

export function GuideInfoButton({ topic, dark = false }: { topic: ScreenGuideTopic; dark?: boolean }) {
  const openGuide = useScreenGuideStore((state) => state.openGuide);
  return (
    <ScaleTap
      label={`How to use ${topic}`}
      onPress={() => openGuide(topic)}
      style={[styles.button, dark && styles.dark]}
    >
      <MaterialIcons name="info-outline" size={26} color={dark ? "#FFFFFF" : GAME_COLORS.ink} />
    </ScaleTap>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 46, height: 46, borderRadius: 23, alignItems: "center", justifyContent: "center",
    backgroundColor: GAME_COLORS.paper, borderWidth: 3, borderColor: GAME_COLORS.ink,
  },
  dark: { backgroundColor: "rgba(0,0,0,0.5)", borderColor: "rgba(255,255,255,0.55)" },
});
