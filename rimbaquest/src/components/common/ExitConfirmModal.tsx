import React from "react";
import { Modal, StyleSheet, Text, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { PrimaryButton } from "./PrimaryButton";
import { Tap } from "./Tap";

export function ExitConfirmModal({
  visible,
  onStay,
  onLeave,
}: {
  visible: boolean;
  onStay: () => void;
  onLeave: () => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onStay}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <View style={styles.iconWrap}>
            <MaterialIcons name="sentiment-dissatisfied" size={32} color="#FFFFFF" />
          </View>
          <Text style={styles.title}>Leave RimbaQuest?</Text>
          <Text style={styles.copy}>Are you sure you want to exit the app?</Text>
          <PrimaryButton label="Stay" style={styles.stayButton} onPress={onStay} />
          <Tap label="Leave the app" style={styles.leaveButton} onPress={onLeave}>
            <Text style={styles.leaveText}>Leave</Text>
          </Tap>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 38,
    backgroundColor: "rgba(0,0,0,0.7)",
  },
  card: {
    borderRadius: 28,
    paddingHorizontal: 28,
    paddingVertical: 30,
    alignItems: "center",
    gap: 12,
    backgroundColor: "#FFFFFF",
  },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0A4D26",
    marginBottom: 4,
  },
  title: {
    color: "#1A1A1A",
    fontSize: 22,
    fontWeight: "900",
    textAlign: "center",
  },
  copy: {
    color: "#667085",
    fontSize: 15,
    lineHeight: 22,
    textAlign: "center",
  },
  stayButton: { width: "100%", marginTop: 8 },
  leaveButton: {
    width: "100%",
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  leaveText: {
    color: "#667085",
    fontSize: 14,
    fontWeight: "700",
    textDecorationLine: "underline",
  },
});
