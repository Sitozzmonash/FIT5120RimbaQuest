import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Tap } from "../../../common/Tap";
import { AvatarPicker } from "./AvatarPicker";
import { ConfirmPasswordField } from "./ConfirmPasswordField";
import { EmailField } from "./EmailField";
import { PasswordField } from "./PasswordField";
import { StepNav } from "./StepNav";
import { UsernameField } from "./UsernameField";

export function AccountStep({
  onBack,
  onNext,
  onLogin,
}: {
  onBack: () => void;
  onNext: () => void;
  onLogin: () => void;
}) {
  return (
    <View style={styles.createStepBody}>
      <UsernameField />
      <EmailField />
      <PasswordField />
      <ConfirmPasswordField />
      <AvatarPicker />

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
