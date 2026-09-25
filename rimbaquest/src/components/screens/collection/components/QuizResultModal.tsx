import React from "react";
import { Modal, StyleSheet, Text, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useAbilityQuizStore } from "../../../../store/useAbilityQuizStore";
import { Tap } from "../../../common/Tap";
import { PrimaryButton } from "../../../common/PrimaryButton";

export function QuizResultModal() {
  const result = useAbilityQuizStore((state) => state.result);
  const slot = useAbilityQuizStore((state) => state.pendingSlot);

  return (
    <Modal visible={!!result} transparent animationType="fade">
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <View
            style={[styles.iconWrap, result?.passed && styles.iconWrapPassed]}
          >
            <MaterialIcons
              name={result?.passed ? "military-tech" : "refresh"}
              size={32}
              color={result?.passed ? "#0A4D26" : "#92400E"}
            />
          </View>
          <Text style={styles.title}>
            {result?.passed ? "You Did It!" : "Almost There!"}
          </Text>
          <Text style={styles.score}>
            You got {result?.score} out of {result?.total} right
          </Text>
          <Text style={styles.message}>
            {result?.passed
              ? slot === 3
                ? "You earned a new 4-Energy special move for battle!"
                : "You earned a new special move!"
              : "Try again and get every answer right to earn this ability."}
          </Text>
          <View style={styles.actions}>
            {result?.passed ? (
              <PrimaryButton
                label="Continue"
                icon="check"
                onPress={() => useAbilityQuizStore.getState().finishQuiz()}
              />
            ) : (
              <>
                <PrimaryButton
                  label="Try Again"
                  icon="refresh"
                  onPress={() => useAbilityQuizStore.getState().retryQuiz()}
                />
                <Tap
                  label="Leave quiz"
                  style={styles.exitBtn}
                  onPress={() => useAbilityQuizStore.getState().finishQuiz()}
                >
                  <Text style={styles.exitBtnText}>Leave Quiz</Text>
                </Tap>
              </>
            )}
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
    padding: 24,
    alignItems: "center",
    gap: 10,
  },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#FEF3C7",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  iconWrapPassed: { backgroundColor: "#E8F6EE" },
  title: { color: "#1A1A1A", fontSize: 22, fontWeight: "800" },
  score: { color: "#0A4D26", fontSize: 16, fontWeight: "800" },
  message: {
    color: "#4A554D",
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
    marginBottom: 6,
  },
  actions: { width: "100%", gap: 10 },
  exitBtn: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
  },
  exitBtnText: { color: "#98A2B3", fontSize: 14, fontWeight: "700" },
});
