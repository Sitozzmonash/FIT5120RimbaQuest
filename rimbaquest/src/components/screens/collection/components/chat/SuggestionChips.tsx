import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { FONTS } from "../../../../../constants/fonts";
import { ScaleTap } from "../../../../common/ScaleTap";
import { CHAT_COLORS } from "./chatTheme";

export function SuggestionChips({
  suggestions,
  disabled,
  onPick,
}: {
  suggestions: string[];
  disabled: boolean;
  onPick: (question: string) => void;
}) {
  return (
    <View style={styles.row}>
      {suggestions.map((suggestion) => (
        <ScaleTap
          key={suggestion}
          label={`Ask: ${suggestion}`}
          style={[styles.chip, disabled && styles.disabled]}
          disabled={disabled}
          onPress={() => onPick(suggestion)}
        >
          <Text style={styles.text}>{suggestion}</Text>
        </ScaleTap>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    minHeight: 36 + 3,
    justifyContent: "center",
    paddingHorizontal: 14,
    backgroundColor: CHAT_COLORS.chip,
    borderWidth: 2,
    borderBottomWidth: 5,
    borderColor: CHAT_COLORS.ink,
    borderRadius: 999,
  },
  disabled: { opacity: 0.5 },
  text: {
    fontFamily: FONTS.bodyBlack,
    color: CHAT_COLORS.chipText,
    fontSize: 13,
  },
});
