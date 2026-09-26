import React from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { FONTS } from "../../../../constants/fonts";
import { PrimaryButton } from "../../../common/PrimaryButton";
import { LOCATION_COLORS } from "../locationsTheme";

// Loading, failure and no-match states shown inside the places panel.
export function PlacesStatus({
  loading = false,
  message,
  onRetry,
}: {
  loading?: boolean;
  message: string;
  onRetry?: () => void;
}) {
  return (
    <View style={styles.wrap}>
      {loading && <ActivityIndicator color={LOCATION_COLORS.go} />}
      <Text style={styles.message}>{message}</Text>
      {onRetry && (
        <PrimaryButton label="Try Again" icon="refresh" onPress={onRetry} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    gap: 14,
  },
  message: {
    color: LOCATION_COLORS.muted,
    fontSize: 14,
    fontFamily: FONTS.bodyBold,
    textAlign: "center",
  },
});
