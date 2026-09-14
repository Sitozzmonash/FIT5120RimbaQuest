import React from "react";
import { ActivityIndicator, Modal, StyleSheet, Text, View } from "react-native";
import { useUserStore } from "../../store/useUserStore";

export function AppLoadingModal() {
  const loading = useUserStore((state) => state.profileLoading);

  return (
    <Modal visible={loading} transparent animationType="fade" onRequestClose={() => {}}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <ActivityIndicator size="large" color="#0A4D26" />
          <Text style={styles.title}>Getting Your Adventure Ready!</Text>
          <Text style={styles.copy}>
            Waking up your wildlife collection and explorer badges...
          </Text>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  card: {
    width: "100%",
    maxWidth: 320,
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    paddingVertical: 28,
    paddingHorizontal: 24,
    alignItems: "center",
    gap: 10,
  },
  title: { color: "#0A4D26", fontSize: 16, fontWeight: "900", marginTop: 6, textAlign: "center" },
  copy: { color: "#566159", fontSize: 12, textAlign: "center" },
});
