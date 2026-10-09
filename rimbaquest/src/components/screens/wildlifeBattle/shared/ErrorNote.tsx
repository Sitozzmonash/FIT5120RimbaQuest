import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { FONTS } from "../../../../constants/fonts";
import { GAME_COLORS } from "../../../common/game/gameTheme";
import { ScaleTap } from "../../../common/ScaleTap";

const INK = GAME_COLORS.ink;
const ERROR = "#A13D25";

export function ErrorNote({
  message,
  actionLabel,
  onAction,
  disabled = false,
}: {
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  disabled?: boolean;
}) {
  return (
    <View style={styles.note} accessibilityRole="alert">
      <MaterialIcons name="error-outline" size={20} color={ERROR} />
      <Text style={styles.text}>{message}</Text>
      {actionLabel && onAction ? (
        <ScaleTap
          label={actionLabel}
          onPress={onAction}
          disabled={disabled}
          style={[styles.action, disabled && styles.disabled]}
        >
          <Text style={styles.actionText}>{actionLabel}</Text>
        </ScaleTap>
      ) : null}
    </View>
  );
}

export const errorTextStyle = StyleSheet.create({
  text: {
    fontFamily: FONTS.bodyBold,
    fontSize: 12,
    lineHeight: 17,
    color: ERROR,
  },
}).text;

const styles = StyleSheet.create({
  note: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 12,
    backgroundColor: "#FFF0E9",
    borderWidth: 2,
    borderColor: ERROR,
    borderRadius: 14,
  },
  text: {
    flex: 1,
    fontFamily: FONTS.bodyBold,
    fontSize: 12,
    lineHeight: 17,
    color: ERROR,
  },
  disabled: { opacity: 0.45 },
  action: {
    minHeight: 34,
    paddingHorizontal: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFB938",
    borderWidth: 2,
    borderColor: INK,
    borderRadius: 999,
    boxShadow: `0px 3px 0px ${INK}`,
  },
  actionText: { fontFamily: FONTS.button, fontSize: 13, color: INK },
});
