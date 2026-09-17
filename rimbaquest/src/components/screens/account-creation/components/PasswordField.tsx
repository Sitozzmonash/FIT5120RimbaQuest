import React, { useState } from "react";
import { Text, TextInput, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { Controller, useFormContext } from "react-hook-form";
import { Tap } from "../../../common/Tap";
import { AccountFormValues } from "../accountFormTypes";
import { fieldStyles as styles } from "./fieldStyles";

export function PasswordField() {
  const {
    control,
    formState: { errors },
  } = useFormContext<AccountFormValues>();
  const error = errors.password?.message;
  const [showPassword, setShowPassword] = useState(false);

  return (
    <View style={styles.createField}>
      <Text style={styles.createFieldLabel}>Password *</Text>
      <View
        style={[styles.createInputBox, error && styles.createInputBoxError]}
      >
        <MaterialIcons name="lock-outline" size={18} color="#0A4D26" />
        <Controller
          control={control}
          name="password"
          rules={{
            required: "Please create a password.",
            minLength: {
              value: 6,
              message:
                "Use at least 6 letters, numbers, or symbols for your password.",
            },
          }}
          render={({ field: { value, onChange, onBlur } }) => (
            <TextInput
              style={styles.createInput}
              placeholder="Create a password"
              placeholderTextColor="#6A9B7D"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              secureTextEntry={!showPassword}
            />
          )}
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
      {error && <Text style={styles.createFieldError}>{error}</Text>}
    </View>
  );
}
