import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { Species } from "../../../types";
import { Tap } from "../../common/Tap";
import { PrimaryButton } from "../../common/PrimaryButton";
import { styles as globalStyles } from "../../../styles/theme";
import { BattleHeaderBar } from "./components/BattleHeaderBar";
import { BattleIntroBanner } from "./components/BattleIntroBanner";
import { BattleCardTile } from "./components/BattleCardTile";
import { BattleEmptyState } from "./components/BattleEmptyState";

export function BattleSelectScreen({
  unlockedSpecies,
  selectedCard,
  onSelectCard,
  onStartBattle,
  onStartDiscovery,
  onBack,
}: {
  unlockedSpecies: Species[];
  selectedCard: Species | null;
  onSelectCard: (card: Species) => void;
  onStartBattle: () => void;
  onStartDiscovery: () => void;
  onBack: () => void;
}) {
  const hasCards = unlockedSpecies.length > 0;

  return (
    <View style={styles.root}>
      <BattleHeaderBar title="Wildlife Card Battles" />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <BattleIntroBanner />

        {hasCards ? (
          <>
            <Text style={styles.sectionTitle}>Select Your Battle Card</Text>
            <View style={styles.grid}>
              {unlockedSpecies.map((item) => (
                <BattleCardTile
                  key={item.id}
                  species={item}
                  selected={selectedCard?.id === item.id}
                  onPress={() => onSelectCard(item)}
                />
              ))}
            </View>
          </>
        ) : (
          <BattleEmptyState onStartDiscovery={onStartDiscovery} />
        )}
      </ScrollView>

      {hasCards ? (
        <View style={styles.footer}>
          <PrimaryButton
            label="Start Battle"
            disabled={!selectedCard}
            onPress={onStartBattle}
          />
          <Tap label="Quit" style={globalStyles.secondary} onPress={onBack}>
            <Text style={globalStyles.secondaryText}>Quit</Text>
          </Tap>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#FFFFFF" },
  content: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 24, gap: 16 },
  sectionTitle: { color: "#0A4D26", fontSize: 18, fontWeight: "900", marginTop: 4 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  footer: {
    borderTopWidth: 1,
    borderTopColor: "#E2ECE4",
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
    gap: 4,
    backgroundColor: "#FFFFFF",
  },
});
