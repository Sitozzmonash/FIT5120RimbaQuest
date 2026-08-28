import React from "react";
import { StyleSheet, Text, View } from "react-native";

export type CategoryProgress = {
  id: string;
  label: string;
  found: number;
  total: number;
};

export function CategoryProgressList({
  categories,
}: {
  categories: CategoryProgress[];
}) {
  return (
    <View>
      <Text style={styles.heading}>CATEGORY COLLECTION PROGRESS</Text>
      {categories.map((item) => (
        <View style={styles.row} key={item.id}>
          <Text style={styles.label} numberOfLines={1}>
            {item.label}
          </Text>
          <Text style={styles.value}>
            {item.found} / {item.total}
          </Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  heading: {
    color: "#0A4D26",
    fontSize: 13,
    fontWeight: "900",
    letterSpacing: 0.4,
    marginTop: 18,
    marginBottom: 10,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    borderWidth: 1,
    borderColor: "#DFE7E1",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 8,
    backgroundColor: "#FFFFFF",
  },
  label: {
    flex: 1,
    minWidth: 0,
    color: "#1B211C",
    fontSize: 13,
    fontWeight: "800",
  },
  value: { flexShrink: 0, color: "#637D6E", fontSize: 12, fontWeight: "700" },
});
