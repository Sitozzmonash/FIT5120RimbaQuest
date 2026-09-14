import React from "react";
import { Text, TextInput, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { Controller, useFormContext } from "react-hook-form";
import { EMAIL_RE } from "../../../../constants/validation";
import { AccountFormValues } from "../accountFormTypes";
import { fieldStyles as styles } from "./fieldStyles";

export function EmailField() {
  const {
    control,
    formState: { errors },
  } = useFormContext<AccountFormValues>();
  const error = errors.email?.message;

  return (
    <View style={styles.createField}>
      <Text style={styles.createFieldLabel}>Email Address *</Text>
      <View
        style={[styles.createInputBox, error && styles.createInputBoxError]}
      >
        <MaterialIcons name="mail-outline" size={18} color="#0A4D26" />
        <Controller
          control={control}
          name="email"
          rules={{
            required: "Please enter an email address.",
            pattern: {
              value: EMAIL_RE,
              message: "Please enter a valid email address.",
            },
          }}
          render={({ field: { value, onChange, onBlur } }) => (
            <TextInput
              style={styles.createInput}
              placeholder="name@example.com"
              placeholderTextColor="#6A9B7D"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              autoCapitalize="none"
              keyboardType="email-address"
            />
          )}
        />
      </View>
      {error && <Text style={styles.createFieldError}>{error}</Text>}
    </View>
  );
}
