import React, { useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useDiscoveryStore } from "../../../store/useDiscoveryStore";
import { useSelectedSpeciesStore } from "../../../store/useSelectedSpeciesStore";
import { DiscoveryHeader } from "./components/DiscoveryHeader";
import { DiscoveryBottomNav } from "./components/DiscoveryBottomNav";
import { PhotoPreview } from "./components/PhotoPreview";
import { InfoCard } from "./components/InfoCard";
import { LocationEditSheet } from "./components/LocationEditSheet";
import { AiDetectionNotice } from "./components/AiDetectionNotice";
import { ConfirmationPrompt } from "./components/ConfirmationPrompt";

export function ConfirmScreen() {
  const selected = useSelectedSpeciesStore((state) => state.selected);
  const discoveryLocation = useDiscoveryStore(
    (state) => state.discoveryLocation,
  );
  const locationMode = useDiscoveryStore((state) => state.locationMode);
  const resolvingLocation = useDiscoveryStore(
    (state) => state.resolvingLocation,
  );
  const saveError = useDiscoveryStore((state) => state.saveError);
  const reporting = useDiscoveryStore((state) => state.reportingVerification);

  const [editingLocation, setEditingLocation] = useState(false);
  const [finalizing, setFinalizing] = useState(false);

  const locationValue =
    locationMode === "auto"
      ? discoveryLocation ||
        (resolvingLocation
          ? "Detecting location..."
          : "Using current device location")
      : discoveryLocation || "Tap to set location";

  const handleConfirm = async () => {
    setFinalizing(true);
    const ok = await useDiscoveryStore.getState().confirmAndSave();
    if (!ok) setFinalizing(false);
  };

  const handleReport = async () => {
    await useDiscoveryStore.getState().reportAndExit();
  };

  return (
    <View style={styles.page}>
      <DiscoveryHeader
        title="Check Your Animal"
        confirmDiscard
        onDiscard={() => useDiscoveryStore.getState().discardAndExit()}
        disabled={finalizing || reporting}
      />
      <ScrollView contentContainerStyle={styles.content}>
        <AiDetectionNotice />

        <PhotoPreview />

        <View style={styles.speciesHeader}>
          <Text style={styles.speciesName}>{selected.common_name}</Text>
          <View style={styles.categoryPill}>
            <Text style={styles.categoryPillText}>{selected.category}</Text>
          </View>
        </View>

        <View style={styles.infoSection}>
          <InfoCard
            icon="place"
            label="LOCATION"
            value={locationValue}
            onPress={() => setEditingLocation(true)}
          />
        </View>

        {saveError ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{saveError}</Text>
          </View>
        ) : null}

        <ConfirmationPrompt />
      </ScrollView>

      <DiscoveryBottomNav
        onBack={() => void handleReport()}
        backLabel={reporting ? "Sending..." : "No, That's Wrong"}
        backDisabled={finalizing || reporting}
        nextLabel={finalizing ? "Saving..." : "Yes, Save It"}
        nextDisabled={finalizing || reporting}
        onNext={() => void handleConfirm()}
      />

      <LocationEditSheet
        visible={editingLocation}
        onClose={() => setEditingLocation(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: "#FFFFFF" },
  content: { padding: 16, gap: 16 },
  speciesHeader: { gap: 6 },
  speciesName: {
    color: "#1A1A1A",
    fontSize: 24,
    lineHeight: 30,
    fontWeight: "800",
  },
  categoryPill: {
    alignSelf: "flex-start",
    backgroundColor: "#E8F5EE",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  categoryPillText: { color: "#12B347", fontSize: 12, fontWeight: "800" },
  infoSection: { gap: 12 },
  errorBox: {
    borderWidth: 1,
    borderColor: "#F3C6C6",
    backgroundColor: "#FCE8E8",
    borderRadius: 14,
    padding: 14,
  },
  errorText: {
    color: "#B3261E",
    fontSize: 13,
    fontWeight: "700",
    textAlign: "center",
  },
});
