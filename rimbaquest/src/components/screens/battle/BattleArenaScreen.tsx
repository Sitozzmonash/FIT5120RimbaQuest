import React, { useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { Species } from "../../../types";
import { imageFor } from "../../../constants/images";
import { BattleHeaderBar } from "./components/BattleHeaderBar";
import { ArenaCombatantCard } from "./components/ArenaCombatantCard";
import { BattleVsBadge } from "./components/BattleVsBadge";
import { BattleLogPanel } from "./components/BattleLogPanel";
import { BattleActionBar } from "./components/BattleActionBar";
import { BattleOutcomePanel } from "./components/BattleOutcomePanel";
import { GiveUpConfirmModal } from "./components/GiveUpConfirmModal";

export function BattleArenaScreen({
  card,
  opponentName,
  opponentImage,
  playerHp,
  playerMaxHp,
  opponentHp,
  opponentMaxHp,
  battleLog,
  battleRound,
  battleOutcome,
  xpAwarded,
  isAttacking,
  onAttack,
  onGiveUp,
  onBattleAgain,
  onSelectAnotherCard,
  onBack,
}: {
  card: Species;
  opponentName: string;
  opponentImage: number;
  playerHp: number;
  playerMaxHp: number;
  opponentHp: number;
  opponentMaxHp: number;
  battleLog: string[];
  battleRound: number;
  battleOutcome: "playing" | "win" | "lose" | null;
  xpAwarded?: number | null;
  isAttacking: boolean;
  onAttack: () => void;
  onGiveUp: () => void;
  onBattleAgain: () => void;
  onSelectAnotherCard: () => void;
  onBack: () => void;
}) {
  const [giveUpConfirmVisible, setGiveUpConfirmVisible] = useState(false);
  const title =
    battleOutcome === "win" ? "Victory" : battleOutcome === "lose" ? "Defeat" : "Battle Arena";

  return (
    <View style={styles.root}>
      <BattleHeaderBar title={title} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <ArenaCombatantCard
          role="opponent"
          name={opponentName}
          image={opponentImage}
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

        <BattleLogPanel round={battleRound} log={battleLog} />

        {battleOutcome === "playing" && (
          <BattleActionBar
            isAttacking={isAttacking}
            onAttack={onAttack}
            onGiveUp={() => setGiveUpConfirmVisible(true)}
          />
        )}
      </ScrollView>

      <GiveUpConfirmModal
        visible={giveUpConfirmVisible}
        onCancel={() => setGiveUpConfirmVisible(false)}
        onConfirm={() => {
          setGiveUpConfirmVisible(false);
          onGiveUp();
        }}
      />

      <BattleOutcomePanel
        visible={battleOutcome === "win" || battleOutcome === "lose"}
        outcome={battleOutcome === "win" ? "win" : "lose"}
        xpAwarded={xpAwarded}
        onBattleAgain={onBattleAgain}
        onSelectAnotherCard={onSelectAnotherCard}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#FFFFFF" },
  content: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 40, gap: 16 },
});
