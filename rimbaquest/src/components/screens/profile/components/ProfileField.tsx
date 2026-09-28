import React from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { FONTS } from "../../../../constants/fonts";
import { PROFILE_COLORS, sectionLabelStyle } from "../profileTheme";

export function ProfileField({
  label,
  icon,
  value,
  hint,
  locked = false,
  onChangeText,
  inputProps,
}: {
  label: string;
  icon: React.ComponentProps<typeof MaterialIcons>["name"];
  value: string;
  hint: string;
  locked?: boolean;
  onChangeText?: (text: string) => void;
  inputProps?: TextInputProps;
}) {
  return (
    <View style={styles.field}>
      <Text style={sectionLabelStyle}>{label}</Text>
      <View
        style={[styles.box, locked ? styles.boxLocked : styles.boxEditable]}
      >
        {!locked && <View style={styles.insetShade} />}
        <MaterialIcons
          name={icon}
          size={19}
          color={locked ? PROFILE_COLORS.lockedText : PROFILE_COLORS.heading}
          style={locked && styles.iconLocked}
        />
        <TextInput
          style={[styles.input, locked && styles.inputLocked]}
          value={value}
          editable={!locked}
          onChangeText={onChangeText}
          accessibilityLabel={label}
          {...inputProps}
        />
      </View>
      <Text style={styles.hint}>{hint}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  field: { gap: 4 },
  box: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    height: 46,
    paddingHorizontal: 12,
    borderWidth: 3,
    borderRadius: 14,
    overflow: "hidden",
  },
  boxEditable: { backgroundColor: "#FFFFFF", borderColor: PROFILE_COLORS.ink },
  boxLocked: {
    backgroundColor: PROFILE_COLORS.lockedBg,
    borderColor: PROFILE_COLORS.lockedBorder,
  },
  insetShade: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 4,
    backgroundColor: "rgba(7, 60, 29, 0.08)",
  },
  input: {
    flex: 1,
    fontFamily: FONTS.bodyExtraBold,
    color: PROFILE_COLORS.heading,
    fontSize: 15,
    paddingVertical: 0,
    // Hides the browser focus ring react-native-web draws around inputs.
    outlineWidth: 0,
  },
  iconLocked: { opacity: 0.45 },
  inputLocked: { color: PROFILE_COLORS.lockedText },
  hint: {
    fontFamily: FONTS.bodyBold,
    color: PROFILE_COLORS.label,
    fontSize: 12,
  },
});
