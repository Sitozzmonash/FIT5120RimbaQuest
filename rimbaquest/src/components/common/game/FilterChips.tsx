import React from "react";
import { ScrollView, StyleSheet, Text } from "react-native";
import { FONTS } from "../../../constants/fonts";
import { ScaleTap } from "../ScaleTap";
import { GAME_COLORS } from "./gameTheme";

export type FilterChipItem = { id: string; label: string };

export function FilterChips({
  items,
  value,
  onSelect,
}: {
  items: readonly FilterChipItem[];
  value: string;
  onSelect: (id: string) => void;
}) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.scroll}
      contentContainerStyle={styles.row}
    >
      {items.map((item) => {
        const active = value === item.id;
        return (
          <ScaleTap
            key={`${item.id}-${active ? "active" : "idle"}`}
            label={`Filter ${item.label}`}
            style={[styles.chip, active ? styles.chipActive : styles.chipIdle]}
            onPress={() => onSelect(item.id)}
          >
            <Text style={[styles.text, active && styles.textActive]}>
              {item.label}
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
  chipActive: { backgroundColor: GAME_COLORS.goldLight, borderBottomWidth: 2 },
  text: { fontFamily: FONTS.display, color: GAME_COLORS.heading, fontSize: 14 },
  textActive: { color: GAME_COLORS.goldText },
});
