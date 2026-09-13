import React from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useForgotPasswordStore } from "../../../../store/useForgotPasswordStore";

export function RecoveryEmailField() {
  const email = useForgotPasswordStore((state) => state.email);
  const setEmail = useForgotPasswordStore((state) => state.setEmail);

  const fieldError = useForgotPasswordStore((state) => state.fieldError);

  return (
    <View>
      <View
        style={[
          styles.forgotInputBox,
          fieldError && styles.forgotInputBoxError,
        ]}
      >
        <MaterialIcons name="mail-outline" size={20} color="#0A4D26" />
        <TextInput
          style={styles.forgotInput}
          placeholder="Parent or Guardian Email Address *"
          placeholderTextColor="#637D6E"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />
      </View>
      {fieldError && <Text style={styles.forgotFieldError}>{fieldError}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  forgotInputBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    height: 52,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: "#D1E8D5",
    backgroundColor: "rgba(255,255,255,0.93)",
    paddingHorizontal: 16,
  },
  forgotInputBoxError: { borderColor: "#D9383A", backgroundColor: "#FFF6F6" },
  forgotInput: {
    flex: 1,
    color: "#0A4D26",
    fontSize: 15,
    fontWeight: "500",
    paddingVertical: 0,
  },
  forgotFieldError: {
    color: "#D9383A",
    fontSize: 11,
    fontWeight: "700",
    marginTop: 4,
    marginLeft: 4,
  },
});
