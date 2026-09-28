import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { AuthLink } from "../../auth/AuthLink";
import { authBodyStyle } from "../../auth/authTheme";
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
    <>
      <View style={styles.fields}>
        <UsernameField />
        <EmailField />
        <PasswordField />
        <ConfirmPasswordField />
        <AvatarPicker />
      </View>

      <StepNav onBack={onBack} nextLabel="Next" onNext={onNext} />

      <View style={styles.loginRow}>
        <Text style={authBodyStyle}>Already have an account?</Text>
        <AuthLink label="Log In" onPress={onLogin} />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  fields: { gap: 10 },
  loginRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
  },
});
