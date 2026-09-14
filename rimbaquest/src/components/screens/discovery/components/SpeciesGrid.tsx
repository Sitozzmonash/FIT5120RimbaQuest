import React from "react";
import { StyleSheet, View } from "react-native";
import { Species } from "../../../../types";
import { SpeciesOptionCard } from "./SpeciesOptionCard";

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
            <SpeciesOptionCard
              key={item.id}
              species={item}
              selected={selectedId === item.id}
              disabled={disabled}
              onPress={() => onSelect(item)}
            />
          ))}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flex: 1, gap: 8 },
  row: { flex: 1, flexDirection: "row", gap: 8 },
});
