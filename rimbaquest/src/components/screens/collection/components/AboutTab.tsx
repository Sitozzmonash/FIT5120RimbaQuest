import React from "react";
import { StyleSheet, View } from "react-native";
import { Species } from "../../../../types";
import { DetailCard } from "./detail/DetailCard";
import { DetailPill } from "./detail/DetailPill";
import { InfoField } from "./detail/InfoField";

function ecologicalRole(category: string): string {
  switch (category) {
    case "Butterfly":
      return "Helps flowers grow by carrying pollen from flower to flower.";
    case "Bird":
      return "Helps new plants grow by carrying seeds to new places.";
    case "Reptile":
      return "Helps keep the numbers of other animals in balance.";
    default:
      return "Helps keep Malaysia's forests healthy.";
  }
}

export function AboutTab({ item }: { item: Species }) {
  return (
    <DetailCard>
      <View style={styles.pills}>
        <DetailPill label="Discovered" tone="green" />
        <DetailPill label={item.category} />
      </View>
      <InfoField label="SCIENTIFIC NAME" value={item.scientific_name} italic />
      {item.act716_status ? (
        <InfoField label="PROTECTION STATUS" value={item.act716_status} />
      ) : null}
      {item.habitat ? <InfoField label="HABITAT" value={item.habitat} /> : null}
      {item.diet ? <InfoField label="DIET" value={item.diet} /> : null}
      <InfoField
        label="ECOLOGICAL ROLE"
        value={ecologicalRole(item.category)}
      />
      {item.fun_fact ? <InfoField label="ABOUT" value={item.fun_fact} /> : null}
    </DetailCard>
  );
}

const styles = StyleSheet.create({
  pills: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
});
