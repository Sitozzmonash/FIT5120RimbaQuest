import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Species } from "../../../../types";

function DetailField({
  label,
  value,
  italic,
}: {
  label: string;
  value: string;
  italic?: boolean;
}) {
  return (
    <View style={styles.detailField}>
      <Text style={styles.detailFieldLabel}>{label}</Text>
      <Text
        style={[
          styles.detailFieldValue,
          italic && styles.detailFieldValueItalic,
        ]}
      >
        {value}
      </Text>
    </View>
  );
}

export function AboutTab({ item }: { item: Species }) {
  const role =
    item.category === "Butterfly"
      ? "Helps flowers grow by carrying pollen from flower to flower."
      : item.category === "Bird"
        ? "Helps new plants grow by carrying seeds to new places."
        : item.category === "Reptile"
          ? "Helps keep the numbers of other animals in balance."
          : "Helps keep Malaysia's forests healthy.";

  return (
    <>
      <View style={styles.detailBadgeRow}>
        <View style={styles.detailDiscoveredBadge}>
          <Text style={styles.detailDiscoveredBadgeText}>Found</Text>
        </View>
        <View style={styles.detailCategoryBadge}>
          <Text style={styles.detailCategoryBadgeText}>{item.category}</Text>
        </View>
      </View>
      <DetailField
        label="Science Name"
        value={item.scientific_name}
        italic
      />
      {item.act716_status ? (
        <DetailField label="Protection Level" value={item.act716_status} />
      ) : null}
      {item.habitat ? (
        <DetailField label="Where It Lives" value={item.habitat} />
      ) : null}
      {item.diet ? <DetailField label="What It Eats" value={item.diet} /> : null}
      <DetailField label="How It Helps Nature" value={role} />
      {item.fun_fact ? (
        <DetailField label="About" value={item.fun_fact} />
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  detailBadgeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 6,
  },
  detailDiscoveredBadge: {
    backgroundColor: "#2EB85C",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  detailDiscoveredBadgeText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "800",
  },
  detailCategoryBadge: {
    backgroundColor: "#E8FADC",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  detailCategoryBadgeText: {
    color: "#0A4D26",
    fontSize: 11,
    fontWeight: "800",
  },
  detailField: { paddingVertical: 10, gap: 4 },
  detailFieldLabel: { color: "#1A1A1A", fontSize: 14, fontWeight: "800" },
  detailFieldValue: { color: "#1A1A1A", fontSize: 14, lineHeight: 20 },
  detailFieldValueItalic: { fontStyle: "italic" },
});
