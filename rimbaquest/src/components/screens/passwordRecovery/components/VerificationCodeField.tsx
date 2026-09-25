import React from "react";
import { TextInput, View, StyleSheet } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useForgotPasswordStore } from "../../../../store/useForgotPasswordStore";

export function VerificationCodeField() {
  const code = useForgotPasswordStore((state) => state.token);
  const setCode = useForgotPasswordStore((state) => state.setToken);

  const fieldError = useForgotPasswordStore((state) => state.fieldError);

  return (
    <View
      style={[
        styles.resetInputBox,
        fieldError && !code && styles.resetInputBoxError,
      ]}
    >
      <MaterialIcons name="vpn-key" size={20} color="#0A4D26" />
      <TextInput
        style={styles.resetInput}
        placeholder="Type all 6 letters or numbers"
        placeholderTextColor="#88A693"
        value={code}
        onChangeText={(val) => setCode(val.replace(/\s/g, "").toUpperCase())}
        autoCapitalize="characters"
        maxLength={50}
      />
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
