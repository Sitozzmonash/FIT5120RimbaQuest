import React from "react";
import { Modal, StyleSheet, Text, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { difficultyLabel, useAbilityQuizStore } from "../../../../store/useAbilityQuizStore";
import { Tap } from "../../../common/Tap";
import { QuizDifficulty } from "../../../../types";

const DIFFICULTY_BADGE: Record<QuizDifficulty, { bg: string; text: string }> = {
  easy: { bg: "#E8F6EE", text: "#0A4D26" },
  medium: { bg: "#FEF3C7", text: "#92400E" },
  hard: { bg: "#FEE2E2", text: "#DC2626" },
};

export function AbilityUnlockModal() {
  const visible = useAbilityQuizStore((state) => state.unlockModalVisible);
  const abilityName = useAbilityQuizStore((state) => state.pendingAbilityName);
  const difficulty = useAbilityQuizStore((state) => state.pendingDifficulty);
  const slot = useAbilityQuizStore((state) => state.pendingSlot);

  const badge = DIFFICULTY_BADGE[difficulty || "easy"];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={() => useAbilityQuizStore.getState().closeUnlockModal()}
    >
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <View style={styles.iconWrap}>
            <MaterialIcons name="lock" size={36} color="#0A4D26" />
          </View>
          <Text style={styles.title}>Earn This Ability</Text>
          <View style={styles.abilityBadge}>
            <Text style={styles.abilityBadgeText}>{abilityName}</Text>
          </View>
          {difficulty && (
            <View style={[styles.difficultyBadge, { backgroundColor: badge.bg }]}>
              <Text style={[styles.difficultyBadgeText, { color: badge.text }]}>
                {difficultyLabel(difficulty)}
              </Text>
            </View>
          )}
          <Text style={styles.message}>
            {slot === 3
              ? "Answer a few questions about this animal to unlock its 4-Energy battle ability!"
              : "Answer a few questions about this animal to earn its battle ability!"}
          </Text>
          <View style={styles.actions}>
            <Tap
              label="Start Quiz"
              style={styles.beginBtn}
              onPress={() => void useAbilityQuizStore.getState().beginChallenge()}
            >
              <Text style={styles.beginBtnText}>Start Quiz</Text>
              <MaterialIcons name="arrow-forward" size={18} color="#FFFFFF" />
            </Tap>
            <Tap
              label="Not Now"
              style={styles.dismissBtn}
              onPress={() => useAbilityQuizStore.getState().closeUnlockModal()}
            >
              <Text style={styles.dismissBtnText}>Not Now</Text>
            </Tap>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.65)",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  card: {
    width: "100%",
    maxWidth: 344,
    backgroundColor: "#FFFFFF",
    borderRadius: 28,
    paddingTop: 32,
    paddingBottom: 28,
    paddingHorizontal: 24,
    alignItems: "center",
    gap: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  iconWrap: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: "#E8F6EE",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  title: { color: "#1A1A1A", fontSize: 24, fontWeight: "800", textAlign: "center" },
  abilityBadge: {
    backgroundColor: "#E8F6EE",
    borderRadius: 99,
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  abilityBadgeText: { color: "#0A4D26", fontSize: 15, fontWeight: "800" },
  difficultyBadge: { borderRadius: 99, paddingHorizontal: 12, paddingVertical: 6 },
  difficultyBadgeText: { fontSize: 13, fontWeight: "800" },
  message: { color: "#667085", fontSize: 15, lineHeight: 22, textAlign: "center" },
  actions: { width: "100%", gap: 16, marginTop: 6 },
  beginBtn: {
    minHeight: 52,
    borderRadius: 18,
    backgroundColor: "#0A4D26",
    borderWidth: 1,
    borderColor: "#78B833",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingHorizontal: 32,
    shadowColor: "#12B347",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  beginBtnText: { color: "#FFFFFF", fontSize: 18, fontWeight: "800" },
  dismissBtn: { alignItems: "center", justifyContent: "center", paddingVertical: 4 },
  dismissBtnText: { color: "#98A2B3", fontSize: 15, fontWeight: "600" },
});
