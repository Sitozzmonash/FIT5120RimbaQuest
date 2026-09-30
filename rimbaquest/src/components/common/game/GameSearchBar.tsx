import React from "react";
import {
  StyleProp,
  StyleSheet,
  TextInput,
  View,
  ViewStyle,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { FONTS } from "../../../constants/fonts";
import { ScaleTap } from "../ScaleTap";
import { GAME_COLORS } from "./gameTheme";

export function GameSearchBar({
  value,
  onChangeText,
  placeholder,
  style,
}: {
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={[styles.pill, style]}>
      {/* Inset shade along the top edge. */}
      <View style={styles.insetShade} />
      <MaterialIcons name="search" size={20} color="#9CA3AF" />
      <TextInput
        placeholder={placeholder}
        placeholderTextColor="rgba(11, 61, 34, 0.75)"
        value={value}
        onChangeText={onChangeText}
        autoCapitalize="none"
        style={styles.input}
      />
      {value.length > 0 && (
        <ScaleTap
          label="Clear search"
          style={styles.clear}
          onPress={() => onChangeText("")}
        >
          <MaterialIcons name="close" size={16} color={GAME_COLORS.paper} />
        </ScaleTap>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    height: 56,
    paddingHorizontal: 14,
    backgroundColor: GAME_COLORS.paper,
    borderWidth: 3,
    borderBottomWidth: 7,
    borderColor: GAME_COLORS.ink,
    borderRadius: 16,
    overflow: "hidden",
  },
  insetShade: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 4,
    backgroundColor: "rgba(7, 60, 29, 0.12)",
  },
  input: {
    flex: 1,
    color: GAME_COLORS.heading,
    fontSize: 15,
    fontFamily: FONTS.bodyBold,
    paddingVertical: 0,
    // Hides the browser focus ring react-native-web draws around inputs.
    outlineWidth: 0,
  },
  clear: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#1A3C28",
  },
});
