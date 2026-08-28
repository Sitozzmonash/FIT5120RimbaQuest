import React, { useState } from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { Tap } from "../../../common/Tap";

// Step 3 of account creation: password + confirmation, then final submit.
export function PasswordStep({
  password,
  setPassword,
  confirmPassword,
  setConfirmPassword,
  fieldErrors,
  submitting,
  onBack,
  onRegister,
}: {
  password: string;
  setPassword: (s: string) => void;
  confirmPassword: string;
  setConfirmPassword: (s: string) => void;
  fieldErrors: Record<string, string>;
  submitting: boolean;
  onBack: () => void;
  onRegister: () => void;
}) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  return (
    <View style={styles.createStepBody}>
      <View style={styles.createField}>
        <Text style={styles.createFieldLabel}>Password *</Text>
        <View
          style={[
            styles.createInputBox,
            fieldErrors.password && styles.createInputBoxError,
          ]}
        >
          <MaterialIcons name="lock-outline" size={18} color="#0A4D26" />
          <TextInput
            style={styles.createInput}
            placeholder="Create a password"
            placeholderTextColor="#6A9B7D"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
          />
          <Tap
            label={showPassword ? "Hide password" : "Show password"}
            style={styles.createEyeToggle}
            onPress={() => setShowPassword((v) => !v)}
          >
            <MaterialIcons
              name={showPassword ? "visibility-off" : "visibility"}
              size={18}
              color="#0A4D26"
            />
          </Tap>
        </View>
        {fieldErrors.password && (
          <Text style={styles.createFieldError}>{fieldErrors.password}</Text>
        )}
      </View>

      <View style={styles.createField}>
        <Text style={styles.createFieldLabel}>Confirm Password *</Text>
        <View
          style={[
            styles.createInputBox,
            fieldErrors.confirmPassword && styles.createInputBoxError,
          ]}
        >
          <MaterialIcons name="lock-outline" size={18} color="#0A4D26" />
          <TextInput
            style={styles.createInput}
            placeholder="Confirm password"
            placeholderTextColor="#6A9B7D"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry={!showConfirm}
          />
          <Tap
            label={
              showConfirm ? "Hide confirm password" : "Show confirm password"
            }
            style={styles.createEyeToggle}
            onPress={() => setShowConfirm((v) => !v)}
          >
            <MaterialIcons
              name={showConfirm ? "visibility-off" : "visibility"}
              size={18}
              color="#0A4D26"
            />
          </Tap>
        </View>
        {fieldErrors.confirmPassword && (
          <Text style={styles.createFieldError}>
            {fieldErrors.confirmPassword}
          </Text>
        )}
      </View>

      <View style={styles.createActions}>
        <View style={styles.createNavButtonsRow}>
          <Tap
            label="Back"
            style={[styles.createSecondaryBtn, styles.createNavButtonFlex]}
            onPress={onBack}
          >
            <MaterialIcons name="chevron-left" size={20} color="#0A4D26" />
            <Text style={styles.createSecondaryBtnText}>Back</Text>
          </Tap>
          <Tap
            label="Create Account"
            style={[
              styles.createCtaBtn,
              styles.createNavButtonFlex,
              submitting && styles.buttonDisabled,
            ]}
            disabled={submitting}
            onPress={onRegister}
          >
            <Text style={styles.createCtaBtnText}>
              {submitting ? "Creating..." : "Create"}
            </Text>
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
  createEyeToggle: { padding: 2 },
  createFieldError: { color: "#D9383A", fontSize: 11, fontWeight: "700" },
  createActions: {
    gap: 12,
    alignItems: "center",
    paddingTop: 6,
    width: "100%",
  },
  createNavButtonsRow: { flexDirection: "row", gap: 12, width: "100%" },
  createNavButtonFlex: { flex: 1 },
  createCtaBtn: {
    borderRadius: 20,
    backgroundColor: "#0A4D26",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    shadowColor: "#0A4D26",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  createCtaBtnText: { color: "#FFFFFF", fontSize: 18, fontWeight: "900" },
  createSecondaryBtn: {
    flexDirection: "row",
    gap: 4,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    borderWidth: 1.5,
    borderColor: "#0A4D26",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
  },
  createSecondaryBtnText: { color: "#0A4D26", fontSize: 16, fontWeight: "800" },
  // Shared "disabled" opacity style (styles/theme.ts), copied here so this
  // step doesn't depend on the shared object.
  buttonDisabled: { opacity: 0.5 },
});
