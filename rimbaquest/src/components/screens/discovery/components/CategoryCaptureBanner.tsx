import React from "react";
import { StyleSheet, Text } from "react-native";

export function CategoryCaptureBanner({ category }: { category: string }) {
  return (
    <Text style={styles.caption} numberOfLines={1} adjustsFontSizeToFit>
      Nice Catch! We found a{" "}
      <Text style={styles.categoryName}>{category.toUpperCase()}</Text>!
    </Text>
  );
}

const styles = StyleSheet.create({
  caption: {
    color: "#3F4A43",
    fontSize: 20,
    lineHeight: 26,
    fontWeight: "800",
    textAlign: "left",
  },
  categoryName: {
    color: "#0A4D26",
    fontSize: 24,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
});
