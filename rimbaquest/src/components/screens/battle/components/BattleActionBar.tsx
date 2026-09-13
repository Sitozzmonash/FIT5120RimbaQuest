import React, { useState, useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { PrimaryButton } from "../../../common/PrimaryButton";
import { Tap } from "../../../common/Tap";
import {
  BattleAbility,
  BattleActionType,
  BattleLegalAction,
  BattlePassive,
  BattlePhase,
  ActionPreview,
  BattleEffect,
} from "../../../../types/battle";

export type BattleAbilityItem = {
  slot: number;
  name: string;
  multiplier?: number;
  heal_amount?: number;
  shield_amount?: number;
  energy_cost?: number;
  description?: string;
  effects?: BattleEffect[];
};

interface BattleActionBarProps {
  disabled?: boolean;
  isAttacking: boolean;
  phase?: BattlePhase;
  busyReason?: string | null;
  baseAttack?: number;
  legalActions?: BattleLegalAction[];
  unlockedAbilities?: number[];
  abilities?: (BattleAbilityItem | BattleAbility)[];
  passive?: BattlePassive | null;
  passiveDefinition?: BattlePassive | null;
  passiveTriggers?: number;
  actionCount?: number;
  rerollReady?: boolean;
  actionPreviews?: ActionPreview[];
  currentRoll?: number | null;
  lucky?: boolean;
  version?: number;
  battleId?: string;
  onExecuteAction: (action: BattleActionType) => void;
  onGiveUp: () => void;
}

interface MoveMeta {
  type: BattleActionType;
  slot?: number;
  fallbackName: string;
  icon: keyof typeof MaterialIcons.glyphMap;
  iconBg: string;
  iconColor: string;
}

const MOVES: MoveMeta[] = [
  { type: "basic", fallbackName: "Basic Attack", icon: "bolt", iconBg: "#E8F5E9", iconColor: "#2E7D32" },
  { type: "brace", fallbackName: "Brace Defense", icon: "shield", iconBg: "#E3F2FD", iconColor: "#1565C0" },
  { type: "active_1", slot: 1, fallbackName: "Active Ability 1", icon: "flash-on", iconBg: "#DCFCE7", iconColor: "#0BA84A" },
  { type: "active_2", slot: 2, fallbackName: "Active Ability 2", icon: "health-and-safety", iconBg: "#DCFCE7", iconColor: "#0BA84A" },
];

export function BattleActionBar({
  disabled = false,
  isAttacking,
  phase = "player_turn",
  busyReason = null,
  baseAttack,
  legalActions = [],
  unlockedAbilities = [],
  abilities = [],
  passive,
  passiveDefinition,
  passiveTriggers = 0,
  actionCount = 0,
  rerollReady,
  actionPreviews = [],
  currentRoll = null,
  lucky = false,
  version = 0,
  battleId = "",
  onExecuteAction,
  onGiveUp,
}: BattleActionBarProps) {
  const [selectedAction, setSelectedAction] = useState<BattleActionType | null>(null);

  useEffect(() => {
    setSelectedAction(null);
  }, [battleId, version, currentRoll]);

  const abilityMap = new Map<number, BattleAbilityItem | BattleAbility>();
  abilities.forEach((a) => {
    if (a.slot) abilityMap.set(a.slot, a);
  });

  const previewFor = (act: BattleActionType) => actionPreviews.find((p) => p.action === act);
  const isServerLegal = (act: BattleActionType) => legalActions.includes(act);
  const isOwned = (slot?: number) => (slot ? unlockedAbilities.includes(slot) : true);

  const getUnavailableReason = (act: BattleActionType, slot?: number): string | null => {
    if (busyReason) {
      return (busyReason.toLowerCase().includes("connection") || busyReason.toLowerCase().includes("error"))
        ? "Connection error"
        : busyReason;
    }
    if (isAttacking) return "Executing turn…";
    if (slot && !unlockedAbilities.includes(slot)) return `Locked: Pass Quiz ${slot}`;
    if (phase === "roll") return "Roll dice first";
    if (phase === "outcome") return "Battle concluded";
    if (disabled) return "Action not available";
    if (!legalActions.includes(act)) {
      if (currentRoll === 6) return (act === "basic" || act === "brace") ? "Roll is 6: Actives only" : "Unavailable on roll 6";
      if (currentRoll !== null && currentRoll >= 1 && currentRoll <= 3) {
        return (act === "active_1" || act === "active_2") ? "Roll is 1–3: Basic/Brace only" : `Unavailable on roll ${currentRoll}`;
      }
      if (currentRoll !== null && currentRoll >= 4 && currentRoll <= 5) return `Unavailable on roll ${currentRoll}`;
      return "Unavailable for current roll";
    }
    return null;
  };

  const effectivePassive = passive || passiveDefinition;
  const isPassiveUnlocked = unlockedAbilities.includes(3) || Boolean(passive);
  const maxTriggers = effectivePassive?.max_triggers;

  const getPassiveBadge = () => {
    if (!isPassiveUnlocked) return { label: "LOCKED", bg: "#EDE7F6", color: "#7B1FA2", hint: null };
    if (maxTriggers && passiveTriggers >= maxTriggers) {
      return { label: "USED", bg: "#ECEFF1", color: "#607D8B", hint: null };
    }
    if (effectivePassive?.trigger === "low_roll_reroll") {
      const hint = rerollReady ? "Reroll ready" : null;
      return { label: "READY", bg: "#E8F5E9", color: "#2E7D32", hint };
    }
    if (effectivePassive?.trigger === "every_third_action_damage" || effectivePassive?.trigger === "every_third_action_heal") {
      return { label: `READY (${actionCount % 3}/3)`, bg: "#E8F5E9", color: "#2E7D32", hint: null };
    }
    if (passiveTriggers > 0) return { label: `TRIGGERED (${passiveTriggers})`, bg: "#FFF8E1", color: "#F57F17", hint: null };
    return { label: "READY", bg: "#E8F5E9", color: "#2E7D32", hint: null };
  };

  const passiveStatus = getPassiveBadge();
  const selectedMeta = MOVES.find((m) => m.type === selectedAction);
  const selectedAbility = selectedMeta?.slot ? abilityMap.get(selectedMeta.slot) : null;
  const selectedName = selectedAbility?.name || selectedMeta?.fallbackName || "";
  const selectedPreview = selectedAction ? previewFor(selectedAction) : null;
  const selectedReason = selectedMeta ? getUnavailableReason(selectedMeta.type, selectedMeta.slot) : null;
  const canConfirm = Boolean(
    selectedAction &&
      isServerLegal(selectedAction) &&
      isOwned(selectedMeta?.slot) &&
      phase === "player_turn" &&
      !disabled &&
      !isAttacking &&
      !busyReason
  );

  return (
    <View style={styles.wrap}>
      <Text style={styles.sectionTitle}>Combat Moves</Text>
      <View style={styles.actionGrid}>
        {MOVES.map((move) => {
          const ability = move.slot ? abilityMap.get(move.slot) : null;
          const name = ability?.name || move.fallbackName;
          const owned = isOwned(move.slot);
          const legal = isServerLegal(move.type) && owned && !disabled && !isAttacking && !busyReason;
          const isSelected = selectedAction === move.type;
          const preview = previewFor(move.type);
          const reason = getUnavailableReason(move.type, move.slot);

          return (
            <Tap
              key={move.type}
              label={`Inspect ${name}${preview?.summary ? `, ${preview.summary}` : ""}`}
              style={[styles.actionCard, isSelected && styles.actionCardSelected, !legal && styles.actionCardDisabled]}
              onPress={() => setSelectedAction(move.type)}
            >
              <View style={styles.actionCardHeader}>
                <View style={[styles.iconBox, { backgroundColor: owned ? move.iconBg : "#EDF1EE" }]}>
                  <MaterialIcons name={owned ? move.icon : "lock"} size={16} color={owned ? move.iconColor : "#879089"} />
                </View>
                <Text style={styles.actionName} numberOfLines={1}>{name}</Text>
              </View>

              <View style={styles.previewChips}>
                {preview ? (
                  <>
                    {preview.damage > 0 && <View style={styles.chipDmg}><Text style={styles.chipDmgText}>⚡ {preview.damage} DMG</Text></View>}
                    {preview.shield_gain > 0 && <View style={styles.chipShield}><Text style={styles.chipShieldText}>🛡️ +{preview.shield_gain} Shield</Text></View>}
                    {preview.healing > 0 && <View style={styles.chipHeal}><Text style={styles.chipHealText}>💚 +{preview.healing} HP</Text></View>}
                    {preview.wasted_healing > 0 && <View style={styles.chipWaste}><Text style={styles.chipWasteText}>⚠️ {preview.wasted_healing} Wasted</Text></View>}
                    {preview.wasted_shield > 0 && <View style={styles.chipWaste}><Text style={styles.chipWasteText}>⚠️ {preview.wasted_shield} Wasted</Text></View>}
                    {lucky && preview.lucky_bonus_damage > 0 && <View style={styles.chipLucky}><Text style={styles.chipLuckyText}>⭐ +{preview.lucky_bonus_damage} Lucky</Text></View>}
                    {preview.statuses.map((s, idx) => (
                      <View key={idx} style={styles.chipBuff}><Text style={styles.chipBuffText}>{s.name || s.type}</Text></View>
                    ))}
                    {preview.effects?.filter((e) => ["boost", "weaken", "guard", "reroll"].includes(e.type)).map((e, idx) => (
                      <View key={`eff-${idx}`} style={styles.chipEff}><Text style={styles.chipEffText}>{e.type.toUpperCase()}</Text></View>
                    ))}
                  </>
                ) : move.type === "basic" ? (
                  <View style={styles.chipDmg}><Text style={styles.chipDmgText}>⚡ {baseAttack ? `${baseAttack} DMG` : "Direct Attack"}</Text></View>
                ) : move.type === "brace" ? (
                  <View style={styles.chipShield}><Text style={styles.chipShieldText}>🛡️ +6 Shield</Text></View>
                ) : ability?.effects && ability.effects.length > 0 ? (
                  ability.effects.map((e, idx) => (
                    <View key={`eff-${idx}`} style={styles.chipEff}><Text style={styles.chipEffText}>{e.type.toUpperCase()}{e.value ? ` ${e.value}` : ""}</Text></View>
                  ))
                ) : ability?.description ? (
                  <Text style={styles.abilityBrief} numberOfLines={1}>{ability.description}</Text>
                ) : null}
              </View>
              {reason ? <Text style={styles.unavailableReason} numberOfLines={1}>{reason}</Text> : null}
            </Tap>
          );
        })}
      </View>

      {selectedAction && selectedMeta && (
        <View style={styles.confirmationBox}>
          <View style={styles.confirmationInfo}>
            <Text style={styles.confirmationTitle}>Selected: <Text style={styles.confirmationMove}>{selectedName}</Text></Text>
            {selectedAbility?.description ? <Text style={styles.confirmationFullDesc}>{selectedAbility.description}</Text> : null}
            {selectedPreview?.summary ? <Text style={styles.confirmationSummary}>{selectedPreview.summary}</Text> : null}
            {lucky && selectedPreview?.lucky_summary ? <Text style={styles.confirmationLuckySummary}>⭐ {selectedPreview.lucky_summary}</Text> : null}
            {selectedReason && !canConfirm ? <Text style={styles.confirmationReason}>⚠️ {selectedReason}</Text> : null}
          </View>
          <PrimaryButton
            label={`Use ${selectedName}`}
            displayText={isAttacking ? "Executing…" : canConfirm ? `Use ${selectedName}` : selectedReason || "Unavailable"}
            icon="play-arrow"
            loading={isAttacking}
            disabled={!canConfirm}
            onPress={() => { if (canConfirm) onExecuteAction(selectedAction); }}
          />
        </View>
      )}

      <View style={styles.passiveContainer}>
        <View style={styles.passiveHeader}>
          <View style={styles.passiveIconBadge}><MaterialIcons name="auto-awesome" size={16} color="#7B1FA2" /></View>
          <View style={styles.passiveInfo}>
            <View style={styles.passiveTitleRow}>
              <Text style={styles.passiveName} numberOfLines={1}>{effectivePassive?.name || "Species Trait"}</Text>
              {passiveStatus.hint ? <Text style={styles.passiveHintText}>{passiveStatus.hint}</Text> : null}
              <View style={[styles.statusBadge, { backgroundColor: passiveStatus.bg }]}><Text style={[styles.statusBadgeText, { color: passiveStatus.color }]}>{passiveStatus.label}</Text></View>
            </View>
            <Text style={styles.passiveDesc}>
              {isPassiveUnlocked ? effectivePassive?.description || "Species trait triggers automatically." : "Locked: Pass Quiz 3 to unlock species passive trait."}
            </Text>
          </View>
        </View>
      </View>

      <Tap label="Surrender Battle" style={[styles.giveUpBtn, (disabled || isAttacking) && styles.btnDisabled]} disabled={disabled || isAttacking} onPress={onGiveUp}>
        <MaterialIcons name="flag" size={15} color="#8C1D24" />
        <Text style={styles.giveUpText}>Surrender</Text>
      </Tap>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 10 },
  sectionTitle: { fontSize: 12, fontWeight: "700", color: "#606C62", marginBottom: 2, textTransform: "uppercase", letterSpacing: 0.5 },
  actionGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  actionCard: { width: "48.5%", minHeight: 82, borderWidth: 1.5, borderColor: "#E2ECE4", backgroundColor: "#F9FAF9", borderRadius: 14, padding: 9, justifyContent: "space-between" },
  actionCardSelected: { borderColor: "#0BA84A", backgroundColor: "#F0FDF4", borderWidth: 2 },
  actionCardDisabled: { opacity: 0.65 },
  actionCardHeader: { flexDirection: "row", alignItems: "center", gap: 6 },
  iconBox: { width: 24, height: 24, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  actionName: { fontSize: 11, fontWeight: "800", color: "#1B211C", flex: 1 },
  previewChips: { flexDirection: "row", flexWrap: "wrap", gap: 3, marginTop: 4 },
  chipDmg: { backgroundColor: "#FFEBEE", borderRadius: 5, paddingHorizontal: 4, paddingVertical: 2 },
  chipDmgText: { fontSize: 9, fontWeight: "800", color: "#C62828" },
  chipShield: { backgroundColor: "#E3F2FD", borderRadius: 5, paddingHorizontal: 4, paddingVertical: 2 },
  chipShieldText: { fontSize: 9, fontWeight: "800", color: "#1565C0" },
  chipHeal: { backgroundColor: "#E8F5E9", borderRadius: 5, paddingHorizontal: 4, paddingVertical: 2 },
  chipHealText: { fontSize: 9, fontWeight: "800", color: "#2E7D32" },
  chipWaste: { backgroundColor: "#FFF3E0", borderRadius: 5, paddingHorizontal: 4, paddingVertical: 2 },
  chipWasteText: { fontSize: 9, fontWeight: "700", color: "#E65100" },
  chipLucky: { backgroundColor: "#FFF8E1", borderRadius: 5, paddingHorizontal: 4, paddingVertical: 2 },
  chipLuckyText: { fontSize: 9, fontWeight: "800", color: "#F57F17" },
  chipBuff: { backgroundColor: "#EDE7F6", borderRadius: 5, paddingHorizontal: 4, paddingVertical: 2 },
  chipBuffText: { fontSize: 9, fontWeight: "800", color: "#6A1B9A" },
  chipEff: { backgroundColor: "#E0F2F1", borderRadius: 5, paddingHorizontal: 4, paddingVertical: 2 },
  chipEffText: { fontSize: 9, fontWeight: "800", color: "#00695C" },
  abilityBrief: { fontSize: 9, color: "#606C62", marginTop: 2 },
  unavailableReason: { fontSize: 8.5, fontWeight: "700", color: "#78909C", marginTop: 3 },
  confirmationBox: { backgroundColor: "#FFFFFF", borderRadius: 14, borderWidth: 1.5, borderColor: "#0BA84A", padding: 12, gap: 8 },
  confirmationInfo: { gap: 3 },
  confirmationTitle: { fontSize: 12, color: "#4A5568" },
  confirmationMove: { fontWeight: "800", color: "#1B4D2E" },
  confirmationFullDesc: { fontSize: 11, color: "#374151", lineHeight: 15 },
  confirmationSummary: { fontSize: 11, color: "#2E7D32", fontWeight: "600" },
  confirmationLuckySummary: { fontSize: 11, color: "#FF8F00", fontWeight: "700" },
  confirmationReason: { fontSize: 10, color: "#C62828", fontWeight: "600" },
  passiveContainer: { borderWidth: 1.5, borderColor: "#E1BEE7", backgroundColor: "#F3E5F5", borderRadius: 14, paddingHorizontal: 12, paddingVertical: 10 },
  passiveHeader: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  passiveIconBadge: { width: 28, height: 28, borderRadius: 14, backgroundColor: "#EDE7F6", alignItems: "center", justifyContent: "center", marginTop: 2 },
  passiveInfo: { flex: 1, gap: 2 },
  passiveTitleRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  passiveName: { fontSize: 13, fontWeight: "800", color: "#4A148C", flex: 1 },
  passiveHintText: { fontSize: 9, fontWeight: "700", color: "#2E7D32", backgroundColor: "#E8F5E9", paddingHorizontal: 4, paddingVertical: 1, borderRadius: 4 },
  statusBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  statusBadgeText: { fontSize: 9, fontWeight: "900" },
  passiveDesc: { fontSize: 11, color: "#6A1B9A", lineHeight: 15 },
  giveUpBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 6 },
  giveUpText: { fontSize: 13, fontWeight: "700", color: "#8C1D24" },
  btnDisabled: { opacity: 0.5 },
});
