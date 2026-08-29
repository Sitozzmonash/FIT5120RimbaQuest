import React from "react";
import { Modal, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialIcons } from "@expo/vector-icons";
import { Tap } from "../../../common/Tap";
import { PrimaryButton } from "../../../common/PrimaryButton";

export function BattleOutcomePanel({
  visible,
  outcome,
  xpAwarded,
  onBattleAgain,
  onSelectAnotherCard,
}: {
  visible: boolean;
  outcome: "win" | "lose";
  xpAwarded?: number | null;
  onBattleAgain: () => void;
  onSelectAnotherCard: () => void;
}) {
  const win = outcome === "win";

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={() => {}}
    >
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <LinearGradient
            colors={win ? ["#F4FCF6", "#DFF6E7"] : ["#FFF5F5", "#FFE1E1"]}
            style={styles.gradient}
          />
          <View style={[styles.iconCircle, { backgroundColor: win ? "#4CAF50" : "#E8541A" }]}>
            <MaterialIcons
              name={win ? "emoji-events" : "sentiment-dissatisfied"}
              size={30}
              color="#FFFFFF"
            />
          </View>
          <Text style={[styles.title, { color: win ? "#087B35" : "#8C1D24" }]}>
            {win ? "Victory!" : "Defeat"}
          </Text>
          <Text style={styles.copy}>
            {win
              ? "Your Wildlife Card won this battle."
              : "Your Wildlife Card was defeated. Try another card or battle again."}
          </Text>

          {xpAwarded ? (
            <View style={styles.xpBadge}>
              <LinearGradient colors={["#FFD940", "#FFC314"]} style={styles.xpBadgeGradient}>
                <MaterialIcons name="star" size={13} color="#0A4D26" />
                <Text style={styles.xpBadgeText}>+{xpAwarded} Explorer XP</Text>
              </LinearGradient>
            </View>
          ) : null}

          <PrimaryButton label="Battle Again" style={styles.primaryBtn} onPress={onBattleAgain} />
          <Tap label="Choose Another Card" style={styles.secondaryBtn} onPress={onSelectAnotherCard}>
            <Text style={styles.secondaryText}>Choose Another Card</Text>
          </Tap>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
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
    gap: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  gradient: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0 },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  title: { fontSize: 22, fontWeight: "900" },
  copy: {
    fontSize: 12,
    color: "#566159",
    textAlign: "center",
    marginTop: 6,
    marginBottom: 4,
  },
  xpBadge: { borderRadius: 14, overflow: "hidden", marginTop: 6, marginBottom: 4 },
  xpBadgeGradient: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  xpBadgeText: { color: "#0A4D26", fontSize: 11, fontWeight: "800" },
  primaryBtn: { width: "100%", marginTop: 10 },
  secondaryBtn: {
    width: "100%",
    minHeight: 48,
    marginTop: 9,
    borderRadius: 999,
    backgroundColor: "#FFFFFF",
    borderColor: "#0A4D26",
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryText: { color: "#0A4D26", fontSize: 14, fontWeight: "800" },
});
