import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Species } from "../../../../types";

export function FactsTab({ item }: { item: Species }) {
  const facts = [
    item.fun_fact,
    "Wild animals need peaceful space to thrive in their natural habitat.",
    "Watch from a respectful distance and never feed or touch wildlife.",
  ].filter(Boolean) as string[];

  return (
    <>
      {facts.map((fact, idx) => (
        <React.Fragment key={idx}>
          <View style={styles.detailFactRow}>
            <Text style={styles.detailFactText}>{fact}</Text>
          </View>
          {idx < facts.length - 1 && <View style={styles.detailDivider} />}
        </React.Fragment>
      ))}
    </>
  );
}

const styles = StyleSheet.create({
  detailFactRow: { paddingVertical: 14 },
  detailFactText: { color: "#1A1A1A", fontSize: 14, lineHeight: 20 },
  detailDivider: { height: 1, backgroundColor: "#E6E6E6" },
});
