import React from "react";
import { Text, TextInput, View, StyleSheet } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useLoginStore } from "../../../../store/useLoginStore";

export function UsernameField() {
  const username = useLoginStore((state) => state.username);
  const setUsername = useLoginStore((state) => state.setUsername);

  const error = useLoginStore((state) => state.fieldErrors.username);

  return (
    <View>
      <View style={[styles.loginInputBox, error && styles.loginInputBoxError]}>
        <MaterialIcons name="mail-outline" size={20} color="#0A4D26" />
        <TextInput
          style={styles.loginInput}
          placeholder="Username or Email Address *"
          placeholderTextColor="#0A4D26"
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
        />
      </View>
      {error && <Text style={styles.loginFieldError}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  loginInputBox: {
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
  loginInputBoxError: { borderColor: "#D9383A", backgroundColor: "#FFF6F6" },
  loginInput: {
    flex: 1,
    color: "#0A4D26",
    fontSize: 15,
    fontWeight: "500",
    paddingVertical: 0,
  },
  loginEyeToggle: { padding: 2 },
  loginFieldError: {
    color: "#D9383A",
    fontSize: 11,
    fontWeight: "700",
    marginTop: 6,
    marginLeft: 4,
  },
});
