import React from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { imageFor, SPECIES_IMAGES } from "../../../constants/images";
import { useBattleStore } from "../../../store/useBattleStore";
import { BattleHeaderBar } from "./components/BattleHeaderBar";
import { ArenaCombatantCard } from "./components/ArenaCombatantCard";
import { BattleVsBadge } from "./components/BattleVsBadge";
import { BattleLogPanel } from "./components/BattleLogPanel";
import { BattleActionBar } from "./components/BattleActionBar";
import { BattleOutcomePanel } from "./components/BattleOutcomePanel";
import { GiveUpConfirmModal } from "./components/GiveUpConfirmModal";

export function BattleArenaScreen() {
  const card = useBattleStore((state) => state.playerCard);
  const opponent = useBattleStore((state) => state.opponent);
  const playerHp = useBattleStore((state) => state.playerHp);
  const playerMaxHp = useBattleStore((state) => state.playerMaxHp);
  const opponentHp = useBattleStore((state) => state.opponentHp);
  const opponentMaxHp = useBattleStore((state) => state.opponentMaxHp);
  const battleOutcome = useBattleStore((state) => state.outcome);

  if (!card) return null;

  const title =
    battleOutcome === "win" ? "Victory" : battleOutcome === "lose" ? "Defeat" : "Battle Arena";

  return (
    <View style={styles.root}>
      <BattleHeaderBar title={title} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <ArenaCombatantCard
          role="opponent"
          name={opponent.name}
          image={SPECIES_IMAGES[opponent.species_id] || SPECIES_IMAGES.sp_wild_boar}
          hp={opponentHp}
          maxHp={opponentMaxHp}
        />
        <BattleVsBadge />
        <ArenaCombatantCard
          role="player"
          name={card.common_name}
          image={imageFor(card)!}
          hp={playerHp}
          maxHp={playerMaxHp}
          categoryLabel={card.category}
          atk={card.base_attack || 25}
        />

        <BattleLogPanel />

        {battleOutcome === "playing" && <BattleActionBar />}
      </ScrollView>

      <GiveUpConfirmModal />

      <BattleOutcomePanel />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#FFFFFF" },
  content: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 40, gap: 16 },
});
