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
      <Text style={styles.createFieldLabel}>Explorer Name *</Text>
      <View
        style={[styles.createInputBox, error && styles.createInputBoxError]}
      >
        <MaterialIcons name="person-outline" size={18} color="#0A4D26" />
        <Controller
          control={control}
          name="username"
          rules={{
            required: "Please choose an explorer name.",
            minLength: {
              value: 3,
              message: "Use 3 to 20 letters or numbers for your explorer name.",
            },
            maxLength: {
              value: 20,
              message: "Use 3 to 20 letters or numbers for your explorer name.",
            },
            pattern: {
              value: /^[a-zA-Z0-9_-]+$/,
              message:
                "Use only letters or numbers. You can also use - or _ with no spaces.",
            },
          }}
          render={({ field: { value, onChange, onBlur } }) => (
            <TextInput
              style={styles.createInput}
              placeholder="For example: JungleHero7"
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
