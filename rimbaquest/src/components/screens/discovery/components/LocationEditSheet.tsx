import React from "react";
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { LocationItem, LocationMode } from "../../../../types";
import { Tap } from "../../../common/Tap";
import { PrimaryButton } from "../../../common/PrimaryButton";

export function LocationEditSheet({
  visible,
  onClose,
  discoveryLocation,
  setDiscoveryLocation,
  locationMode,
  setLocationMode,
  resolvingLocation,
  locationOptions,
  locationNotice,
}: {
  visible: boolean;
  onClose: () => void;
  discoveryLocation: string;
  setDiscoveryLocation: (s: string) => void;
  locationMode: LocationMode;
  setLocationMode: (m: LocationMode) => void;
  resolvingLocation?: boolean;
  locationOptions: LocationItem[];
  locationNotice: string | null;
}) {
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
          <Text style={styles.title}>Discovery Location</Text>

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
                Manual
              </Text>
            </Tap>
          </View>

          {locationNotice ? (
            <Text style={styles.notice}>{locationNotice}</Text>
          ) : null}

          {locationMode === "auto" ? (
            resolvingLocation ? (
              <View style={styles.detectingRow}>
                <ActivityIndicator size="small" color="#087B35" />
                <Text style={styles.muted}>Detecting your location...</Text>
              </View>
            ) : discoveryLocation ? (
              <View style={styles.detectedRow}>
                <MaterialIcons name="my-location" size={16} color="#087B35" />
                <Text style={styles.detectedText} numberOfLines={2}>
                  {discoveryLocation}
                </Text>
              </View>
            ) : (
              <Text style={styles.muted}>
                RimbaQuest will use this device's current location when you
                save the discovery.
              </Text>
            )
          ) : (
            <>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.chips}
              >
                {locationOptions.map((loc) => (
                  <Tap
                    key={loc.id}
                    label={loc.name}
                    style={[
                      styles.chip,
                      discoveryLocation === loc.name && styles.chipActive,
                    ]}
                    onPress={() => setDiscoveryLocation(loc.name)}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        discoveryLocation === loc.name && styles.chipTextActive,
                      ]}
                    >
                      {loc.name}
                    </Text>
                  </Tap>
                ))}
              </ScrollView>
              <TextInput
                style={styles.input}
                value={discoveryLocation}
                onChangeText={setDiscoveryLocation}
                placeholder="Or type a location name"
                placeholderTextColor="#879089"
              />
            </>
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
  muted: { color: "#707872", fontSize: 12, lineHeight: 18 },
  detectingRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  detectedRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#EDF5EF",
    borderRadius: 12,
    padding: 10,
  },
  detectedText: {
    flex: 1,
    color: "#0A4D26",
    fontSize: 13,
    fontWeight: "700",
  },
  chips: { gap: 8, paddingVertical: 4 },
  chip: {
    borderRadius: 16,
    backgroundColor: "#F0F4F1",
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  chipActive: { backgroundColor: "#0A4D26" },
  chipText: { fontSize: 12, color: "#607068", fontWeight: "700" },
  chipTextActive: { color: "#FFFFFF" },
  input: {
    borderWidth: 1,
    borderColor: "#C8D1CA",
    borderRadius: 12,
    paddingHorizontal: 12,
    minHeight: 44,
    fontSize: 14,
    color: "#1B211C",
  },
  doneBtn: { marginTop: 4 },
});
