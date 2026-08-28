import React from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { Tap } from "../../../common/Tap";
import { AvatarPicker } from "./AvatarPicker";
import { StepNav } from "./StepNav";

// Step 1 of account creation: username, email, optional avatar, and the
// "already have an account?" login hand-off.
export function AccountStep({
  username,
  setUsername,
  onBlurUsername,
  email,
  setEmail,
  onBlurEmail,
  avatar,
  setAvatar,
  fieldErrors,
  onBack,
  onNext,
  onLogin,
}: {
  username: string;
  setUsername: (s: string) => void;
  onBlurUsername: () => void;
  email: string;
  setEmail: (s: string) => void;
  onBlurEmail: () => void;
  avatar: string;
  setAvatar: (s: string) => void;
  fieldErrors: Record<string, string>;
  onBack: () => void;
  onNext: () => void;
  onLogin: () => void;
}) {
  return (
    <View style={styles.createStepBody}>
      <View style={styles.createField}>
        <Text style={styles.createFieldLabel}>Username *</Text>
        <View
          style={[
            styles.createInputBox,
            fieldErrors.username && styles.createInputBoxError,
          ]}
        >
          <MaterialIcons name="person-outline" size={18} color="#0A4D26" />
          <TextInput
            style={styles.createInput}
            placeholder="3-20 characters"
            placeholderTextColor="#6A9B7D"
            value={username}
            onChangeText={setUsername}
            onBlur={onBlurUsername}
            autoCapitalize="none"
          />
        </View>
        {fieldErrors.username && (
          <Text style={styles.createFieldError}>{fieldErrors.username}</Text>
        )}
      </View>

      <View style={styles.createField}>
        <Text style={styles.createFieldLabel}>Email Address *</Text>
        <View
          style={[
            styles.createInputBox,
            fieldErrors.email && styles.createInputBoxError,
          ]}
        >
          <MaterialIcons name="mail-outline" size={18} color="#0A4D26" />
          <TextInput
            style={styles.createInput}
            placeholder="name@example.com"
            placeholderTextColor="#6A9B7D"
            value={email}
            onChangeText={setEmail}
            onBlur={onBlurEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />
        </View>
        {fieldErrors.email && (
          <Text style={styles.createFieldError}>{fieldErrors.email}</Text>
        )}
      </View>

      <AvatarPicker avatar={avatar} setAvatar={setAvatar} />

      <View style={styles.createActions}>
        <StepNav onBack={onBack} nextLabel="Next" onNext={onNext} />
        <View style={styles.createLoginRow}>
          <Text style={styles.createLoginText}>Already have an account?</Text>
          <Tap label="Log In" style={{}} onPress={onLogin}>
            <Text style={styles.createLoginLink}>Log In</Text>
          </Tap>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  createStepBody: { gap: 16 },
  createField: { gap: 4 },
  createFieldLabel: { color: "#0A4D26", fontSize: 15, fontWeight: "700" },
  createInputBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    height: 48,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: "#D1E8D5",
    backgroundColor: "#F4FCF6",
    paddingHorizontal: 16,
  },
  createInputBoxError: { borderColor: "#D9383A", backgroundColor: "#FFF6F6" },
  createInput: {
    flex: 1,
    color: "#0A4D26",
    fontSize: 15,
    fontWeight: "500",
    paddingVertical: 0,
  },
  createFieldError: { color: "#D9383A", fontSize: 11, fontWeight: "700" },
  createActions: {
    gap: 12,
    alignItems: "center",
    paddingTop: 6,
    width: "100%",
  },
  createLoginRow: { alignItems: "center", gap: 2 },
  createLoginText: { color: "#2D5A3E", fontSize: 14 },
  createLoginLink: {
    color: "#0A4D26",
    fontSize: 14,
    fontWeight: "700",
    textDecorationLine: "underline",
  },
});
