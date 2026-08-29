import React from "react";
import {
  ActivityIndicator,
  StyleProp,
  StyleSheet,
  Text,
  TextStyle,
  ViewStyle,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialIcons } from "@expo/vector-icons";
import { Tap } from "./Tap";

type IconName = React.ComponentProps<typeof MaterialIcons>["name"];

export function PrimaryButton({
  label,
  displayText,
  onPress,
  icon,
  loading = false,
  disabled = false,
  style,
  textStyle,
}: {
  label: string;
  displayText?: string;
  onPress: () => void;
  icon?: IconName;
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}) {
  return (
    <Tap
      label={label}
      style={[styles.button, (disabled || loading) && styles.disabled, style]}
      disabled={disabled || loading}
      onPress={onPress}
    >
      <LinearGradient colors={["#146B3A", "#0A4D26"]} style={styles.gradient} />
      {loading ? (
        <ActivityIndicator color="#FFFFFF" size="small" />
      ) : icon ? (
        <MaterialIcons name={icon} size={18} color="#FFFFFF" />
      ) : null}
      <Text style={[styles.text, textStyle]}>{displayText ?? label}</Text>
    </Tap>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 50,
    borderRadius: 999,
    overflow: "hidden",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  disabled: { opacity: 0.5 },
  gradient: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0 },
  text: { color: "#FFFFFF", fontSize: 15, fontWeight: "800" },
});
