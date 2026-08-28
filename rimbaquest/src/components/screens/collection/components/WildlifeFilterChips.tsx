import React from "react";
import { ScrollView, StyleSheet, Text } from "react-native";
import { WILDLIFE_FILTERS } from "../../../../constants/seed";
import { Tap } from "../../../common/Tap";

const CHIP_LABELS: Record<string, string> = {
  All: "All",
  Butterfly: "Butterflies",
};

export function WildlifeFilterChips({
  filter,
  onSelect,
}: {
  filter: string;
  onSelect: (id: string) => void;
}) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.collectionTabsScroll}
      contentContainerStyle={styles.collectionTabsRow}
    >
      {WILDLIFE_FILTERS.map((item) => (
        <Tap
          key={item.id}
          label={`Filter ${item.label}`}
          style={[
            styles.collectionChip,
            filter === item.id && styles.collectionChipActive,
          ]}
          onPress={() => onSelect(item.id)}
        >
          <Text
            style={[
              styles.collectionChipText,
              filter === item.id && styles.collectionChipTextActive,
            ]}
          >
            {CHIP_LABELS[item.id] ?? item.label}
          </Text>
        </Tap>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  collectionTabsScroll: { flexGrow: 0 },
  collectionTabsRow: { gap: 8, paddingHorizontal: 16, paddingBottom: 12 },
  collectionChip: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#C8E4C8",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  collectionChipActive: { backgroundColor: "#78B833", borderColor: "#78B833" },
  collectionChipText: { color: "#0A4D26", fontSize: 12, fontWeight: "700" },
  collectionChipTextActive: { color: "#FFFFFF" },
});
