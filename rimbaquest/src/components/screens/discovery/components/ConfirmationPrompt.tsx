import React from "react";
import { StyleSheet, Text, View } from "react-native";

export function ConfirmationPrompt() {
  return (
    <View style={styles.question}>
      <Text style={styles.title}>Is this the species you saw?</Text>
      <Text style={styles.subtitle}>
        Look at the photo and species name one more time before you save it.
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
