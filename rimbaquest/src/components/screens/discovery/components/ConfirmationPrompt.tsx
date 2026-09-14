import React from "react";
import { StyleSheet, Text, View } from "react-native";

export function ConfirmationPrompt() {
  return (
    <View style={styles.question}>
      <Text style={styles.title}>Is this the species you saw?</Text>
      <Text style={styles.subtitle}>
        Double-check the photo and details before you record your discovery.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  question: { gap: 8, paddingTop: 8 },
  title: { color: "#1A1A1A", fontSize: 16, fontWeight: "800" },
  subtitle: {
    color: "#1A1A1A",
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "500",
  },
});
