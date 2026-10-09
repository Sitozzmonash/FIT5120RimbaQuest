import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { FONTS } from "../../../constants/fonts";
import { Tap } from "../../common/Tap";
import { AUTH_COLORS } from "./authTheme";

export function AuthTextField({
  label,
  icon,
  password = false,
  compact = false,
  error,
  ...inputProps
}: {
  label: string;
  icon: React.ComponentProps<typeof MaterialIcons>["name"];
  password?: boolean;
  // Shorter box and tighter label gap for long forms.
  compact?: boolean;
  error?: string | boolean | null;
} & Omit<TextInputProps, "style" | "secureTextEntry">) {
  const [visible, setVisible] = useState(false);

  return (
    <View style={[styles.field, compact && styles.fieldCompact]}>
      <Text style={styles.label}>{label}</Text>
      <View
        style={[
          styles.box,
          compact && styles.boxCompact,
          error ? styles.boxError : null,
        ]}
      >
        <MaterialIcons name={icon} size={20} color={AUTH_COLORS.icon} />
        <TextInput
          style={styles.input}
          placeholderTextColor={AUTH_COLORS.placeholder}
          accessibilityLabel={label}
          secureTextEntry={password && !visible}
          {...inputProps}
        />
        {password && (
          <Tap
            label={visible ? "Hide password" : "Show password"}
            style={styles.eye}
            onPress={() => setVisible((v) => !v)}
          >
            <MaterialIcons
              name={visible ? "visibility-off" : "visibility"}
              size={20}
              color={AUTH_COLORS.placeholder}
            />
          </Tap>
        )}
      </View>
      {typeof error === "string" && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  field: { gap: 6 },
  fieldCompact: { gap: 4 },
  label: {
    fontFamily: FONTS.bodyExtraBold,
    color: AUTH_COLORS.title,
    fontSize: 13,
  },
  box: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    height: 52,
    paddingHorizontal: 16,
    backgroundColor: "#FFFFFF",
    borderWidth: 2,
    borderColor: AUTH_COLORS.inputBorder,
    borderRadius: 16,
    boxShadow: "0px 2px 2px rgba(7, 60, 29, 0.2)",
  },
  boxCompact: { height: 44, borderRadius: 14 },
  boxError: {
    borderColor: AUTH_COLORS.error,
    backgroundColor: AUTH_COLORS.errorBg,
  },
  input: {
    flex: 1,
    fontFamily: FONTS.bodySemiBold,
    color: AUTH_COLORS.title,
    fontSize: 14,
    paddingVertical: 0,
    outlineWidth: 0,
  },
  eye: { padding: 2 },
  error: {
    fontFamily: FONTS.bodyBold,
    color: AUTH_COLORS.error,
    fontSize: 12,
    marginLeft: 4,
  },
});
