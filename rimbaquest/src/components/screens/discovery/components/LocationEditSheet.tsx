import React from "react";
import { Modal, StyleSheet, Text, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useDiscoveryStore } from "../../../../store/useDiscoveryStore";
import { Tap } from "../../../common/Tap";
import { PrimaryButton } from "../../../common/PrimaryButton";
import { LocationAutoSection } from "./LocationAutoSection";
import { LocationManualSection } from "./LocationManualSection";

export function LocationEditSheet({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  const locationMode = useDiscoveryStore((state) => state.locationMode);
  const setLocationMode = useDiscoveryStore((state) => state.setLocationMode);

  const locationNotice = useDiscoveryStore((state) => state.locationNotice);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <Tap label="Close" style={StyleSheet.absoluteFill} onPress={onClose}>
          <View />
        </Tap>
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <Text style={styles.title}>Where Did You Find It?</Text>

          <View style={styles.modeRow}>
            <Tap
              label="Use my current location"
              style={[
                styles.modeChip,
                locationMode === "auto" && styles.modeChipActive,
              ]}
              onPress={() => setLocationMode("auto")}
            >
              <MaterialIcons
                name="my-location"
                size={16}
                color={locationMode === "auto" ? "#087B35" : "#68716C"}
              />
              <Text
                style={[
                  styles.modeText,
                  locationMode === "auto" && styles.modeTextActive,
                ]}
              >
                Automatic
              </Text>
            </Tap>
            <Tap
              label="Enter location manually"
              style={[
                styles.modeChip,
                locationMode === "manual" && styles.modeChipActive,
              ]}
              onPress={() => setLocationMode("manual")}
            >
              <MaterialIcons
                name="edit-location-alt"
                size={16}
                color={locationMode === "manual" ? "#087B35" : "#68716C"}
              />
              <Text
                style={[
                  styles.modeText,
                  locationMode === "manual" && styles.modeTextActive,
                ]}
              >
                Type a Place
              </Text>
            </Tap>
          </View>

          {locationNotice ? (
            <Text style={styles.notice}>{locationNotice}</Text>
          ) : null}

          {locationMode === "auto" ? (
            <LocationAutoSection />
          ) : (
            <LocationManualSection />
          )}

          <PrimaryButton label="Done" style={styles.doneBtn} onPress={onClose} />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 20,
    gap: 12,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#D8EDD8",
    alignSelf: "center",
    marginBottom: 4,
  },
  title: { color: "#1A1A1A", fontSize: 18, fontWeight: "900" },
  modeRow: { flexDirection: "row", gap: 8 },
  modeChip: {
    flex: 1,
    flexDirection: "row",
    gap: 6,
    borderWidth: 1,
    borderColor: "#C8D1CA",
    borderRadius: 14,
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
  },
  modeChipActive: { borderColor: "#0A4D26", backgroundColor: "#EDF5EF" },
  modeText: { fontSize: 12, fontWeight: "800", color: "#68716C" },
  modeTextActive: { color: "#087B35" },
  notice: {
    color: "#8B5D00",
    backgroundColor: "#FFF7DD",
    borderRadius: 10,
    padding: 10,
    fontSize: 12,
  },
  doneBtn: { marginTop: 4 },
});
