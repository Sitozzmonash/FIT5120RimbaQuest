import React from "react";
import { StyleSheet, View } from "react-native";
import { imageFor } from "../../../../constants/images";
import { Species } from "../../../../types";
import { PickCard } from "./PickCard";

// Two-column grid of species to choose from.
export function SpeciesGrid({
  speciesList,
  selectedId,
  disabled,
  onSelect,
}: {
  speciesList: Species[];
  selectedId: string | null;
  disabled: boolean;
  onSelect: (item: Species) => void;
}) {
  const rows: Species[][] = [];
  for (let i = 0; i < speciesList.length; i += 2) {
    rows.push(speciesList.slice(i, i + 2));
  }

  return (
    <View style={styles.grid}>
      {rows.map((row, index) => (
        <View key={index} style={styles.row}>
          {row.map((item) => (
            <PickCard
              key={item.id}
              image={imageFor(item)}
              label={item.common_name}
              selected={selectedId === item.id}
              disabled={disabled}
              onPress={() => onSelect(item)}
            />
          ))}
          {row.length === 1 && <View style={styles.spacer} />}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { gap: 8, alignSelf: "stretch", paddingHorizontal: 0 },
  row: { flexDirection: "row", gap: 8 },
  spacer: { flex: 1 },
});
