import React, { useState } from "react";
import { Text, TextInput, View, StyleSheet } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useForgotPasswordStore } from "../../../../store/useForgotPasswordStore";
import { Tap } from "../../../common/Tap";

export function ConfirmNewPasswordField() {
  const confirmPassword = useForgotPasswordStore(
    (state) => state.confirmPassword,
  );
  const setConfirmPassword = useForgotPasswordStore(
    (state) => state.setConfirmPassword,
  );

  const fieldError = useForgotPasswordStore((state) => state.fieldError);

  const [showConfirm, setShowConfirm] = useState(false);

  return (
    <View>
      <View
        style={[styles.resetInputBox, fieldError && styles.resetInputBoxError]}
      >
        <MaterialIcons name="lock-outline" size={20} color="#0A4D26" />
        <TextInput
          style={styles.resetInput}
          placeholder="••••••••"
          placeholderTextColor="#88A693"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry={!showConfirm}
        />
        <Tap
          label={
            showConfirm ? "Hide confirm password" : "Show confirm password"
          }
          style={styles.resetEyeToggle}
          onPress={() => setShowConfirm((v) => !v)}
        >
          <MaterialIcons
            name={showConfirm ? "visibility-off" : "visibility"}
            size={20}
            color="#0A4D26"
          />
        </Tap>
      </View>
      {fieldError && <Text style={styles.resetFieldError}>{fieldError}</Text>}
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
