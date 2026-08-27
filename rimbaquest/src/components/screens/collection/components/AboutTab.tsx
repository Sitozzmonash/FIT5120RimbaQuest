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
      ? "Helps pollinate flowering plants while moving between gardens and forest edges."
      : item.category === "Bird"
        ? "Helps spread seeds and supports a healthy rainforest food web."
        : item.category === "Reptile"
          ? "Helps keep the food web in balance as part of its wetland and forest habitat."
          : "Plays an important role in Malaysia’s forest food web and healthy habitat.";

  return (
    <>
      <View style={styles.detailBadgeRow}>
        <View style={styles.detailDiscoveredBadge}>
          <Text style={styles.detailDiscoveredBadgeText}>Discovered</Text>
        </View>
        <View style={styles.detailCategoryBadge}>
          <Text style={styles.detailCategoryBadgeText}>{item.category}</Text>
        </View>
      </View>
      <DetailField
        label="Scientific Name"
        value={item.scientific_name}
        italic
      />
      {item.act716_status ? (
        <DetailField label="Protection Status" value={item.act716_status} />
      ) : null}
      {item.habitat ? (
        <DetailField label="Habitat" value={item.habitat} />
      ) : null}
      {item.diet ? <DetailField label="Diet" value={item.diet} /> : null}
      <DetailField label="Ecological Role" value={role} />
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
