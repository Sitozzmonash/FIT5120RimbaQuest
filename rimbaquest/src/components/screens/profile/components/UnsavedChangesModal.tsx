import React from "react";
import { Modal, StyleSheet, Text, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { Tap } from "../../../common/Tap";
import { PrimaryButton } from "../../../common/PrimaryButton";

export function UnsavedChangesModal({
  visible,
  onCancel,
  onConfirm,
}: {
  visible: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <View style={styles.iconWrap}>
            <MaterialIcons name="warning-amber" size={26} color="#E8541A" />
          </View>
          <Text style={styles.title}>Unsaved changes</Text>
          <Text style={styles.message}>
            You have unsaved changes. Leave this page and lose them?
          </Text>
          <View style={styles.actions}>
            <PrimaryButton label="Keep Editing" onPress={onCancel} />
            <Tap label="Leave without saving" style={styles.leaveBtn} onPress={onConfirm}>
              <Text style={styles.leaveText}>Leave</Text>
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
    backgroundColor: "#FDECE3",
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
  leaveBtn: {
    height: 48,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: "#D9383A",
    alignItems: "center",
    justifyContent: "center",
  },
  leaveText: { color: "#D9383A", fontSize: 15, fontWeight: "800" },
});
