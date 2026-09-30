import React from "react";
import { StyleSheet, Text } from "react-native";
import { GameProgressBar } from "../../../common/game/GameProgressBar";
import { WoodCard } from "../../../common/game/WoodCard";
import { CategoryProgress, percentOf } from "../profileProgress";
import { sectionLabelStyle } from "../profileTheme";
import { CollectionSummary } from "./CollectionSummary";
import { GroupProgressRow } from "./GroupProgressRow";

export function AnimalCardsCard({
  found,
  total,
  categories,
}: {
  found: number;
  total: number;
  categories: CategoryProgress[];
}) {
  const percent = percentOf(found, total);

  return (
    <WoodCard title="Your Animal Cards" bodyStyle={styles.body}>
      <CollectionSummary found={found} total={total} percent={percent} />
      <GameProgressBar percent={percent} />
      <Text style={sectionLabelStyle}>ANIMALS BY GROUP</Text>
      {categories.map((item, index) => (
        <GroupProgressRow
          key={item.id}
          label={item.label}
          found={item.found}
          total={item.total}
          last={index === categories.length - 1}
        />
      ))}
    </WoodCard>
  );
}

const styles = StyleSheet.create({
  body: { gap: 8, paddingTop: 10 },
});
