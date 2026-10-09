import React from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { FONTS } from "../../../../../constants/fonts";
import { DETAIL_COLORS } from "./detailTheme";

export function TabStatus({
  message,
  loading = false,
}: {
  message: string;
  loading?: boolean;
}) {
  return (
    <View style={styles.wrap}>
      {loading && <ActivityIndicator color={DETAIL_COLORS.green} />}
      <Text style={styles.text}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: "center", gap: 10, paddingVertical: 24 },
  text: {
    fontFamily: FONTS.bodyBold,
    color: DETAIL_COLORS.body,
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
  },
});
