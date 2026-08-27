import React from "react";
import { Modal, StyleSheet, Text, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { Tap } from "../../../common/Tap";

export function DiscardPhotoModal({
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
          <Text style={styles.title}>Discard this discovery?</Text>
          <Text style={styles.message}>
            Going back now will remove the photo you captured. You'll need to
            take or choose it again.
          </Text>
          <View style={styles.actions}>
            <Tap label="Keep editing" style={styles.keepBtn} onPress={onCancel}>
              <Text style={styles.keepText}>Keep Editing</Text>
            </Tap>
            <Tap
              label="Discard and go back"
              style={styles.discardBtn}
              onPress={onConfirm}
            >
              <Text style={styles.discardText}>Discard & Go Back</Text>
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
  keepBtn: {
    height: 48,
    borderRadius: 999,
    backgroundColor: "#0A4D26",
    alignItems: "center",
    justifyContent: "center",
  },
  keepText: { color: "#FFFFFF", fontSize: 15, fontWeight: "800" },
  discardBtn: {
    height: 48,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: "#D9383A",
    alignItems: "center",
    justifyContent: "center",
  },
  discardText: { color: "#D9383A", fontSize: 15, fontWeight: "800" },
});
