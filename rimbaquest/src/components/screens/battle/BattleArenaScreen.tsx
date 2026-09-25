import React, { useCallback, useEffect, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
  ActivityIndicator,
  BackHandler,
} from "react-native";
import { Species } from "../../../types";
import {
  BattleState,
  BattleEvent,
  BattleLegalAction,
  BattleActionType,
} from "../../../types/battle";
import { BattleHeaderBar } from "./components/BattleHeaderBar";
import { PixelBattleStage } from "./components/PixelBattleStage";
import { BattleDice } from "./components/BattleDice";
import { BattleActionBar } from "./components/BattleActionBar";
import { GiveUpConfirmModal } from "./components/GiveUpConfirmModal";
import { BattleOutcomePanel } from "./components/BattleOutcomePanel";
import { Tap } from "../../common/Tap";
import { MaterialIcons } from "@expo/vector-icons";

export interface BattleArenaScreenProps {
  battleState?: BattleState | null;
  events?: BattleEvent[];
  latestEvent?: BattleEvent | null;
  loading?: boolean;
  rolling?: boolean;
  actionInProgress?: boolean;
  error?: string | null;
  canRetry?: boolean;
  canRefresh?: boolean;
  canRestart?: boolean;
  reducedMotion?: boolean;
  onRollDice?: () => void;
  onPerformAction?: (action: BattleActionType) => void;
  onSurrender?: () => void;
  onRetry?: () => void;
  onRefresh?: () => void;
  onRestart?: () => void;

  // Selected player card
  card: Species;

  // Outcome / Rewards
  xpAwarded?: number | null;
  onBattleAgain: () => void;
  onSelectAnotherCard: () => void;
  onBack: () => void;
  onLeave?: () => void;
}

export function BattleArenaScreen({
  battleState,
  events = [],
  latestEvent = null,
  loading = false,
  rolling = false,
  actionInProgress = false,
  error = null,
  canRetry = false,
  canRefresh = false,
  canRestart = false,
  reducedMotion = false,
  onRollDice,
  onPerformAction,
  onSurrender,
  onRetry,
  onRefresh,
  onRestart,
  card,
  xpAwarded,
  onBattleAgain,
  onSelectAnotherCard,
  onBack,
  onLeave,
}: BattleArenaScreenProps) {
  const [giveUpConfirmVisible, setGiveUpConfirmVisible] = useState(false);
  const [logExpanded, setLogExpanded] = useState(false);

  const round = battleState?.round ?? 1;
  const phase = battleState?.phase ?? "roll";
  const outcome = battleState?.outcome ?? null;
  const isEnded = outcome !== null;
  const isAttacking = actionInProgress || rolling;
  const isBusy = isAttacking || loading;
  const controlsLocked = isBusy || Boolean(error);

  const rollVal = battleState?.current_roll ?? null;
  const isLucky = Boolean(battleState?.lucky);
  const legalActions: BattleLegalAction[] =
    phase === "player_turn" ? (battleState?.legal_actions ?? []) : [];

  const logMessages =
    events.length > 0
      ? events.map((e) => e.message)
      : [`Ready for battle! Roll the nature dice to start round ${round}.`];

  const headerTitle =
    outcome === "win"
      ? "Victory!"
      : outcome === "lose"
      ? "Tired Out"
      : outcome === "draw"
      ? "Draw"
      : outcome === "surrender"
      ? "Surrendered"
      : "Battle Arena";

  const handleBackPress = useCallback(() => {
    if (isBusy) return;
    if (battleState && outcome === null && !canRestart) {
      setGiveUpConfirmVisible(true);
      return;
    }
    onBack();
  }, [isBusy, battleState, outcome, canRestart, onBack]);

  useEffect(() => {
    const subscription = BackHandler.addEventListener("hardwareBackPress", () => {
      handleBackPress();
      return true;
    });
    return () => subscription.remove();
  }, [handleBackPress]);

  const handleSurrenderConfirm = () => {
    setGiveUpConfirmVisible(false);
    onSurrender?.();
  };

  const handleAction = (action: BattleActionType) => {
    if (phase !== "player_turn" || isBusy) return;
    onPerformAction?.(action);
  };

  const busyReason = rolling
    ? "Rolling dice…"
    : actionInProgress
    ? "Executing turn…"
    : loading
    ? "Loading…"
    : error
    ? error
    : null;
  const displayLogs = logExpanded ? logMessages.slice(-6) : [logMessages[logMessages.length - 1]];

  return (
    <View style={styles.root}>
      <BattleHeaderBar
        title={headerTitle}
        round={battleState ? round : undefined}
        phase={battleState ? phase : undefined}
        currentEvent={latestEvent}
        onBack={handleBackPress}
        backDisabled={isBusy}
      />

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Error notice if session encounters an issue */}
        {error && (
          <View style={styles.errorBox}>
            <MaterialIcons name="error-outline" size={18} color="#C62828" />
            <Text style={styles.errorText}>{error}</Text>
            {canRetry && onRetry && (
              <Tap label="Retry action" style={styles.retryBtn} onPress={onRetry}>
                <Text style={styles.retryText}>Retry</Text>
              </Tap>
            )}
            {canRefresh && onRefresh && (
              <Tap label="Refresh state" style={styles.refreshBtn} onPress={onRefresh}>
                <Text style={styles.refreshText}>Refresh</Text>
              </Tap>
            )}
            {canRestart && onRestart && !isBusy && (
              <Tap label="Start over" style={styles.restartBtn} onPress={onRestart}>
                <Text style={styles.restartText}>Start Over</Text>
              </Tap>
            )}
          </View>
        )}

        {/* Loading state indicator / start prompt */}
        {!battleState ? (
          <View style={styles.loadingBox}>
            {loading ? (
              <>
                <ActivityIndicator size="large" color="#0BA84A" />
                <Text style={styles.loadingText}>Initializing battle arena…</Text>
              </>
            ) : (
              <>
                <MaterialIcons name="sports-kabaddi" size={48} color="#81C784" />
                <Text style={styles.promptTitle}>Ready to Enter the Arena?</Text>
                <Text style={styles.promptSubtitle}>
                  Start the encounter with {card.common_name}
                </Text>
                {canRetry && onRetry ? (
                  <Tap label="Retry Start Battle" style={styles.startBtn} onPress={onRetry}>
                    <Text style={styles.startBtnText}>Retry Start</Text>
                  </Tap>
                ) : onRestart ? (
                  <Tap label="Start Battle" style={styles.startBtn} onPress={onRestart}>
                    <Text style={styles.startBtnText}>Start Battle</Text>
                  </Tap>
                ) : null}
              </>
            )}
          </View>
        ) : (
          <>
            {/* Pixel Battle Arena Stage */}
            <PixelBattleStage
              player={battleState.player}
              opponent={battleState.opponent}
              activeSide={battleState.active_side}
              lastEvent={latestEvent}
              reducedMotion={reducedMotion}
            />

            {/* Nature Dice Section - Only rollable when phase === 'roll' */}
            {!isEnded && (
              <BattleDice
                roll={rollVal}
                rolling={rolling}
                lucky={isLucky}
                canRoll={phase === "roll"}
                disabled={controlsLocked || phase !== "roll"}
                onRoll={() => onRollDice?.()}
                reducedMotion={reducedMotion}
              />
            )}

            {/* Combat Action Controls - moved BEFORE log to keep decision panel immediately accessible */}
            {!isEnded && (
              <BattleActionBar
                disabled={controlsLocked || phase !== "player_turn"}
                isAttacking={isAttacking}
                phase={phase}
                busyReason={busyReason}
                baseAttack={battleState.player.base_attack}
                legalActions={legalActions}
                unlockedAbilities={battleState.player.unlocked_abilities ?? []}
                abilities={battleState.player.abilities}
                passive={battleState.player.passive}
                passiveDefinition={battleState.player.passive_definition}
                passiveTriggers={battleState.player.passive_triggers ?? 0}
                actionCount={battleState.player.action_count ?? 0}
                rerollReady={battleState.player.reroll_ready}
                actionPreviews={battleState.action_previews ?? []}
                currentRoll={rollVal}
                lucky={isLucky}
                version={battleState.version}
                battleId={battleState.battle_id}
                onExecuteAction={handleAction}
                onGiveUp={() => setGiveUpConfirmVisible(true)}
              />
            )}

            {/* Battle Events / Log - collapsible showing latest message + expand */}
            <View style={styles.logCard}>
              <Tap
                label={logExpanded ? "Collapse battle log" : "Expand battle log"}
                style={styles.logHeaderRow}
                onPress={() => setLogExpanded(!logExpanded)}
              >
                <MaterialIcons name="menu-book" size={15} color="#566159" />
                <Text style={styles.logTitle}>Battle Log · Round {round}</Text>
                <View style={styles.logSpacer} />
                <MaterialIcons
                  name={logExpanded ? "expand-less" : "expand-more"}
                  size={18}
                  color="#566159"
                />
              </Tap>

              {displayLogs.map((line, idx) => (
                <View key={idx} style={styles.logMessageRow}>
                  <View style={styles.logDot} />
                  <Text style={styles.logText}>{line}</Text>
                </View>
              ))}
            </View>
          </>
        )}
      </ScrollView>

      {/* Give up modal confirmation */}
      <GiveUpConfirmModal
        visible={giveUpConfirmVisible}
        onCancel={() => setGiveUpConfirmVisible(false)}
        onConfirm={handleSurrenderConfirm}
      />

      {/* Outcome Results Modal */}
      <BattleOutcomePanel
        visible={isEnded && !isBusy}
        outcome={outcome}
        xpAwarded={xpAwarded}
        speciesFact={card.fun_fact}
        onBattleAgain={onBattleAgain}
        onSelectAnotherCard={onSelectAnotherCard}
        onLeave={onLeave}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#FFFFFF" },
  content: {
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 36,
    gap: 10,
    maxWidth: 520,
    width: "100%",
    alignSelf: "center",
  },
  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFEBEE",
    borderRadius: 12,
    padding: 10,
    gap: 8,
    borderWidth: 1,
    borderColor: "#FFCDD2",
  },
  errorText: {
    fontSize: 12,
    color: "#C62828",
    flex: 1,
    fontWeight: "600",
  },
  retryBtn: {
    backgroundColor: "#D32F2F",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  retryText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  refreshBtn: {
    backgroundColor: "#1976D2",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  refreshText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  restartBtn: {
    backgroundColor: "#757575",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  restartText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  loadingBox: {
    padding: 32,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  loadingText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#566159",
  },
  promptTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0A4D26",
  },
  promptSubtitle: {
    fontSize: 13,
    color: "#556B2F",
    textAlign: "center",
  },
  startBtn: {
    backgroundColor: "#0BA84A",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
    marginTop: 8,
  },
  startBtnText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
  },
  logCard: {
    borderWidth: 1,
    borderColor: "#E2ECE4",
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "#FAFCFA",
    gap: 6,
  },
  logHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  logTitle: {
    fontSize: 11,
    fontWeight: "900",
    color: "#566159",
  },
  logSpacer: {
    flex: 1,
  },
  logMessageRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  logDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: "#78B833",
    marginTop: 5,
  },
  logText: {
    flex: 1,
    fontSize: 11,
    color: "#273229",
    lineHeight: 15,
  },
});
