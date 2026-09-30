import React from "react";
import { StyleSheet, Text } from "react-native";
import { useFormContext } from "react-hook-form";
import { FONTS } from "../../../../constants/fonts";
import { AUTH_COLORS } from "../../auth/authTheme";
import { AccountFormValues } from "../accountFormTypes";
import { AgeWheelPicker } from "./AgeWheelPicker";
import { StepNav } from "./StepNav";

export function AgeStep({
  onBack,
  onRegister,
}: {
  onBack: () => void;
  onRegister: () => void;
}) {
  const {
    formState: { errors, isSubmitting },
  } = useFormContext<AccountFormValues>();
  const error = errors.age?.message;

  return (
    <>
      <AgeWheelPicker />
      {error && <Text style={styles.error}>{error}</Text>}

      <StepNav
        onBack={onBack}
        nextLabel="Start"
        nextLoading={isSubmitting}
        onNext={onRegister}
      />
    </>
  );
}

const styles = StyleSheet.create({
  error: {
    fontFamily: FONTS.bodyBold,
    color: AUTH_COLORS.error,
    fontSize: 12,
    textAlign: "center",
  },
});
