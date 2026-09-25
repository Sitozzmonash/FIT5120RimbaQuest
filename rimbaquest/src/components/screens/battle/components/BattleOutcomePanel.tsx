import React from "react";
import { Modal, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialIcons } from "@expo/vector-icons";
import { Tap } from "../../../common/Tap";
import { PrimaryButton } from "../../../common/PrimaryButton";
import { BattleOutcomeType } from "../../../../types/battle";

interface BattleOutcomePanelProps {
  visible: boolean;
  outcome: BattleOutcomeType;
  xpAwarded?: number | null;
  speciesFact?: string | null;
  onBattleAgain: () => void;
  onSelectAnotherCard: () => void;
  onLeave?: () => void;
}

export function BattleOutcomePanel({
  visible,
  outcome,
  xpAwarded,
  speciesFact,
  onBattleAgain,
  onSelectAnotherCard,
  onLeave,
}: BattleOutcomePanelProps) {
  const win = outcome === "win";
  const isSurrender = outcome === "surrender";
  const isDraw = outcome === "draw";

  const title = win
    ? "Victory!"
    : isSurrender
    ? "Battle Concluded"
    : isDraw
    ? "Draw"
    : "Tired Out";
  const copy = win
    ? "Your Wildlife Card triumphed with outstanding rainforest prowess!"
    : isSurrender
    ? "Your team wisely took a rest and stepped back from battle."
    : isDraw
    ? "Both combatants stood their ground equally. It is a draw!"
    : "Your Wildlife Card is too tired to continue. Time to rest and recover!";

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onLeave ?? onSelectAnotherCard}
    >
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <LinearGradient
            colors={win ? ["#F4FCF6", "#DFF6E7"] : ["#FFF9C4", "#FFF59D"]}
            style={styles.gradient}
          />
          <View
            style={[
              styles.iconCircle,
              { backgroundColor: win ? "#4CAF50" : isDraw ? "#607D8B" : "#FFA000" },
            ]}
          >
            <MaterialIcons
              name={win ? "emoji-events" : isSurrender ? "flag" : isDraw ? "handshake" : "nightlight-round"}
              size={30}
              color="#FFFFFF"
            />
          </View>
          <Text style={[styles.title, { color: win ? "#087B35" : isDraw ? "#37474F" : "#E65100" }]}>
            {title}
          </Text>
          <Text style={styles.copy}>{copy}</Text>

          {xpAwarded ? (
            <View style={styles.xpBadge}>
              <LinearGradient
                colors={["#FFD940", "#FFC314"]}
                style={styles.xpBadgeGradient}
              >
                <MaterialIcons name="star" size={13} color="#0A4D26" />
                <Text style={styles.xpBadgeText}>+{xpAwarded} Explorer XP</Text>
              </LinearGradient>
            </View>
          ) : null}

          {speciesFact ? (
            <View style={styles.factBox}>
              <View style={styles.factHeader}>
                <MaterialIcons name="menu-book" size={13} color="#2E7D32" />
                <Text style={styles.factTitle}>Nature Learning Fact</Text>
              </View>
              <Text style={styles.factText}>{speciesFact}</Text>
            </View>
          ) : null}

          <PrimaryButton
            label="Battle Again"
            style={styles.primaryBtn}
            onPress={onBattleAgain}
          />
          <Tap
            label="Choose Another Card"
            style={styles.secondaryBtn}
            onPress={onSelectAnotherCard}
          >
            <Text style={styles.secondaryText}>Choose Another Card</Text>
          </Tap>
          {onLeave && (
            <Tap label="Leave to Home" style={styles.leaveBtn} onPress={onLeave}>
              <Text style={styles.leaveText}>Back to Home</Text>
            </Tap>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  card: {
    width: "100%",
    maxWidth: 360,
    borderRadius: 28,
    padding: 22,
    alignItems: "center",
    overflow: "hidden",
    gap: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 4,
    backgroundColor: "#FFFFFF",
  },
  gradient: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0 },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  title: {
    fontSize: 22,
    fontWeight: "900",
    textAlign: "center",
  },
  copy: {
    fontSize: 13,
    color: "#4A5568",
    textAlign: "center",
    lineHeight: 18,
    paddingHorizontal: 8,
  },
  xpBadge: {
    borderRadius: 20,
    overflow: "hidden",
    marginVertical: 4,
  },
  xpBadgeGradient: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  xpBadgeText: {
    fontSize: 13,
    fontWeight: "800",
    color: "#0A4D26",
  },
  factBox: {
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderRadius: 14,
    padding: 10,
    borderWidth: 1,
    borderColor: "#C8E6C9",
    width: "100%",
    marginVertical: 4,
  },
  factHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 4,
  },
  factTitle: {
    fontSize: 11,
    fontWeight: "800",
    color: "#2E7D32",
    textTransform: "uppercase",
  },
  factText: {
    fontSize: 11,
    color: "#263238",
    lineHeight: 16,
  },
  primaryBtn: {
    width: "100%",
    marginTop: 6,
  },
  secondaryBtn: {
    paddingVertical: 10,
  },
  secondaryText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#37474F",
  },
  leaveBtn: {
    width: "100%",
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  leaveText: { color: "#566159", fontSize: 13, fontWeight: "700" },
});
