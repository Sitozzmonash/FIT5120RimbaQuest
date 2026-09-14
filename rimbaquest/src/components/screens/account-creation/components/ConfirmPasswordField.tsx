import React, { useState } from "react";
import { Text, TextInput, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { Controller, useFormContext } from "react-hook-form";
import { Tap } from "../../../common/Tap";
import { AccountFormValues } from "../accountFormTypes";
import { fieldStyles as styles } from "./fieldStyles";

export function ConfirmPasswordField() {
  const {
    control,
    getValues,
    formState: { errors },
  } = useFormContext<AccountFormValues>();
  const error = errors.confirmPassword?.message;
  const [showConfirm, setShowConfirm] = useState(false);

  return (
    <View style={styles.createField}>
      <Text style={styles.createFieldLabel}>Confirm Password *</Text>
      <View
        style={[styles.createInputBox, error && styles.createInputBoxError]}
      >
        <MaterialIcons name="lock-outline" size={18} color="#0A4D26" />
        <Controller
          control={control}
          name="confirmPassword"
          rules={{
            required: "Please confirm your password.",
            validate: (value) =>
              value === getValues("password") || "Passwords do not match.",
          }}
          render={({ field: { value, onChange, onBlur } }) => (
            <TextInput
              style={styles.createInput}
              placeholder="Confirm password"
              placeholderTextColor="#6A9B7D"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              secureTextEntry={!showConfirm}
            />
          )}
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
      {error && <Text style={styles.createFieldError}>{error}</Text>}
    </View>
  );
}
