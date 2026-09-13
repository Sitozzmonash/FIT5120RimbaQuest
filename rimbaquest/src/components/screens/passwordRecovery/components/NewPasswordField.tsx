import React, { useState } from "react";
import { TextInput, View, StyleSheet } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useForgotPasswordStore } from "../../../../store/useForgotPasswordStore";
import { Tap } from "../../../common/Tap";

export function NewPasswordField() {
  const newPassword = useForgotPasswordStore((state) => state.newPassword);
  const setNewPassword = useForgotPasswordStore(
    (state) => state.setNewPassword,
  );

  const fieldError = useForgotPasswordStore((state) => state.fieldError);

  const [showPassword, setShowPassword] = useState(false);

  return (
    <View
      style={[styles.resetInputBox, fieldError && styles.resetInputBoxError]}
    >
      <MaterialIcons name="lock-outline" size={20} color="#0A4D26" />
      <TextInput
        style={styles.resetInput}
        placeholder="••••••••"
        placeholderTextColor="#88A693"
        value={newPassword}
        onChangeText={setNewPassword}
        secureTextEntry={!showPassword}
      />
      <Tap
        label={showPassword ? "Hide password" : "Show password"}
        style={styles.resetEyeToggle}
        onPress={() => setShowPassword((v) => !v)}
      >
        <MaterialIcons
          name={showPassword ? "visibility-off" : "visibility"}
          size={20}
          color="#0A4D26"
        />
      </Tap>
    </View>
  );
}

const styles = StyleSheet.create({
  resetInputBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    height: 52,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: "#D1E8D5",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
  },
  resetInputBoxError: { borderColor: "#D9383A", backgroundColor: "#FFF6F6" },
  resetInput: { flex: 1, color: "#0A4D26", fontSize: 15, paddingVertical: 0 },
  resetEyeToggle: { padding: 2 },
  resetFieldError: { color: "#D9383A", fontSize: 11, fontWeight: "700" },
});
