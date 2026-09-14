import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useUnlockedBattleSpecies } from "../../../hooks/useUnlockedBattleSpecies";
import { useBattleStore } from "../../../store/useBattleStore";
import { useNavigationStore } from "../../../store/useNavigationStore";
import { Tap } from "../../common/Tap";
import { PrimaryButton } from "../../common/PrimaryButton";
import { styles as globalStyles } from "../../../styles/theme";
import { BattleHeaderBar } from "./components/BattleHeaderBar";
import { BattleIntroBanner } from "./components/BattleIntroBanner";
import { BattleCardTile } from "./components/BattleCardTile";
import { BattleEmptyState } from "./components/BattleEmptyState";

export function BattleSelectScreen() {
  const unlockedSpecies = useUnlockedBattleSpecies();
  const selectedCard = useBattleStore((state) => state.playerCard);
  const hasCards = unlockedSpecies.length > 0;

  return (
    <View style={styles.root}>
      <BattleHeaderBar
        title="Wildlife Card Battles"
        onBack={() => useNavigationStore.getState().goBack()}
      />
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <BattleIntroBanner />

        {hasCards ? (
          <>
            <Text style={styles.sectionTitle}>Select Your Battle Card</Text>
            <View style={styles.grid}>
              {unlockedSpecies.map((item) => (
                <BattleCardTile key={item.id} species={item} />
              ))}
            </View>
          </>
        ) : (
          <BattleEmptyState />
        )}
      </ScrollView>

      {hasCards ? (
        <View style={styles.footer}>
          <PrimaryButton
            label="Start Battle"
            disabled={!selectedCard}
            onPress={() =>
              selectedCard &&
              void useBattleStore.getState().startBattle(selectedCard)
            }
          />
          <Tap
            label="Quit"
            style={globalStyles.secondary}
            onPress={() => {
              useBattleStore.getState().resetCardSelection();
              useNavigationStore.getState().goBack();
            }}
          >
            <Text style={globalStyles.secondaryText}>Quit</Text>
          </Tap>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#FFFFFF" },
  content: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 24,
    gap: 16,
  },
  sectionTitle: {
    color: "#0A4D26",
    fontSize: 18,
    fontWeight: "900",
    marginTop: 4,
  },
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
