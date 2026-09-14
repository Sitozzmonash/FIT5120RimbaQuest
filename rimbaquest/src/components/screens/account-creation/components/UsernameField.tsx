import React from "react";
import { Text, TextInput, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { Controller, useFormContext } from "react-hook-form";
import { AccountFormValues } from "../accountFormTypes";
import { fieldStyles as styles } from "./fieldStyles";

export function UsernameField() {
  const {
    control,
    formState: { errors },
  } = useFormContext<AccountFormValues>();
  const error = errors.username?.message;

  return (
    <View style={styles.createField}>
      <Text style={styles.createFieldLabel}>Username *</Text>
      <View
        style={[styles.createInputBox, error && styles.createInputBoxError]}
      >
        <MaterialIcons name="person-outline" size={18} color="#0A4D26" />
        <Controller
          control={control}
          name="username"
          rules={{
            required: "Please enter a username.",
            minLength: {
              value: 3,
              message: "Username must be between 3 and 20 characters.",
            },
            maxLength: {
              value: 20,
              message: "Username must be between 3 and 20 characters.",
            },
          }}
          render={({ field: { value, onChange, onBlur } }) => (
            <TextInput
              style={styles.createInput}
              placeholder="3-20 characters"
              placeholderTextColor="#6A9B7D"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              autoCapitalize="none"
            />
          )}
        />
      </View>
      {error && <Text style={styles.createFieldError}>{error}</Text>}
    </View>
  );
}
