import React from "react";
import { Modal, StyleSheet, Text, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useAbilityQuizStore } from "../../../../store/useAbilityQuizStore";
import { Tap } from "../../../common/Tap";
import { PrimaryButton } from "../../../common/PrimaryButton";

export function QuizGiveUpConfirmModal() {
  const visible = useAbilityQuizStore((state) => state.giveUpConfirmVisible);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={() => useAbilityQuizStore.getState().closeGiveUpConfirm()}
    >
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <View style={styles.iconWrap}>
            <MaterialIcons name="warning-amber" size={26} color="#DC2626" />
          </View>
          <Text style={styles.title}>Stop this quiz?</Text>
          <Text style={styles.message}>
            Your answers will be lost, and you will not earn the special move.
          </Text>
          <View style={styles.actions}>
            <PrimaryButton
              label="Keep Answering"
              onPress={() =>
                useAbilityQuizStore.getState().closeGiveUpConfirm()
              }
            />
            <Tap
              label="Stop quiz"
              style={styles.giveUpBtn}
              onPress={() => useAbilityQuizStore.getState().giveUp()}
            >
              <Text style={styles.giveUpText}>Yes, Stop</Text>
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
    backgroundColor: "rgba(0,0,0,0.45)",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  card: {
    width: "100%",
    maxWidth: 360,
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 20,
    alignItems: "center",
    gap: 8,
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#FEE2E2",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  title: {
    color: "#1A1A1A",
    fontSize: 18,
    fontWeight: "900",
    textAlign: "center",
  },
  message: {
    color: "#5B6660",
    fontSize: 13,
    lineHeight: 19,
    textAlign: "center",
    marginBottom: 8,
  },
  actions: { width: "100%", gap: 10 },
  giveUpBtn: {
    height: 48,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: "#DC2626",
    alignItems: "center",
    justifyContent: "center",
  },
  giveUpText: { color: "#DC2626", fontSize: 15, fontWeight: "800" },
});
