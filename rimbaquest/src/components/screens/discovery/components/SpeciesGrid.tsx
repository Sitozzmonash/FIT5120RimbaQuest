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
  return (
    <View style={styles.grid}>
      {speciesList.map((item) => (
        <SpeciesOptionCard
          key={item.id}
          species={item}
          selected={selectedId === item.id}
          disabled={disabled}
          onPress={() => onSelect(item)}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
});
