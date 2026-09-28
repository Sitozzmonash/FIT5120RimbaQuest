import React from "react";
import { ScrollView, StyleSheet, Text } from "react-native";
import { FONTS } from "../../../../constants/fonts";
import { WILDLIFE_FILTERS } from "../../../../constants/seed";
import { useCollectionStore } from "../../../../store/useCollectionStore";
import { GAME_COLORS } from "../../../common/game/gameTheme";
import { ScaleTap } from "../../../common/ScaleTap";

const CHIP_LABELS: Record<string, string> = {
  All: "All",
  Butterfly: "Butterflies",
};

export function WildlifeFilterChips() {
  const filter = useCollectionStore((state) => state.filter);
  const onSelect = useCollectionStore((state) => state.setFilter);

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.scroll}
      contentContainerStyle={styles.row}
    >
      {WILDLIFE_FILTERS.map((item) => {
        const active = filter === item.id;
        return (
          <ScaleTap
            key={item.id}
            label={`Filter ${item.label}`}
            style={[styles.chip, active ? styles.chipActive : styles.chipIdle]}
            onPress={() => onSelect(item.id)}
          >
            <Text style={[styles.text, active && styles.textActive]}>
              {CHIP_LABELS[item.id] ?? item.label}
            </Text>
          </ScaleTap>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flexGrow: 0 },
  row: {
    gap: 8,
    paddingHorizontal: 16,
    paddingTop: 2,
    paddingBottom: 12,
    alignItems: "flex-end",
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderWidth: 2,
    borderColor: GAME_COLORS.ink,
    borderRadius: 999,
  },
  chipIdle: { backgroundColor: GAME_COLORS.paper, borderBottomWidth: 5 },
  chipActive: { backgroundColor: GAME_COLORS.goldLight },
  text: { fontFamily: FONTS.display, color: GAME_COLORS.heading, fontSize: 14 },
  textActive: { color: GAME_COLORS.goldText },
});
