import React, { useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { LocationItem, LocationMode, Species } from "../../../types";
import { DiscoveryHeader } from "./components/DiscoveryHeader";
import { DiscoveryStepIndicator } from "./components/DiscoveryStepIndicator";
import { DiscoveryBottomNav } from "./components/DiscoveryBottomNav";
import { PhotoPreview } from "./components/PhotoPreview";
import { InfoCard } from "./components/InfoCard";
import { LocationEditSheet } from "./components/LocationEditSheet";

function formatDateTime(d: Date): string {
  const datePart = d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  const timePart = d.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
  return `${datePart}, ${timePart}`;
}

// Step 4: review the photo, species and location before saving. The
// LOCATION card is tappable and opens the automatic/manual picker; DATE &
// TIME is a read-only snapshot of when this review screen was opened.
export function ConfirmScreen({
  photo,
  selected,
  discoveryLocation,
  setDiscoveryLocation,
  locationMode,
  setLocationMode,
  locationOptions,
  locationNotice,
  saveError,
  saving,
  onConfirm,
  onBack,
  onDiscard,
}: {
  photo: { uri: string };
  selected: Species;
  discoveryLocation: string;
  setDiscoveryLocation: (s: string) => void;
  locationMode: LocationMode;
  setLocationMode: (m: LocationMode) => void;
  locationOptions: LocationItem[];
  locationNotice: string | null;
  saveError: string | null;
  saving: boolean;
  onConfirm: () => void;
  onBack: () => void;
  onDiscard: () => void;
}) {
  const [editingLocation, setEditingLocation] = useState(false);
  const [now] = useState(() => new Date());

  const locationValue =
    locationMode === "auto"
      ? "Using current device location"
      : discoveryLocation || "Tap to set location";

  return (
    <View style={styles.page}>
      <DiscoveryHeader
        title="Confirm Discovery"
        onBack={onBack}
        confirmDiscard
        onDiscard={onDiscard}
      />
      <ScrollView contentContainerStyle={styles.content}>
        <DiscoveryStepIndicator step={4} />

        <PhotoPreview photo={photo} />

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
          <InfoCard
            icon="schedule"
            label="DATE & TIME"
            value={formatDateTime(now)}
          />
        </View>

        {saveError ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{saveError}</Text>
          </View>
        ) : null}

        <View style={styles.question}>
          <Text style={styles.questionTitle}>Is this the species you saw?</Text>
          <Text style={styles.questionSubtitle}>
            Double-check the photo and details before you record your discovery.
          </Text>
        </View>
      </ScrollView>

      <DiscoveryBottomNav
        onBack={onBack}
        nextLabel={saving ? "Saving..." : "Confirm & Save"}
        nextDisabled={saving}
        onNext={onConfirm}
      />

      <LocationEditSheet
        visible={editingLocation}
        onClose={() => setEditingLocation(false)}
        discoveryLocation={discoveryLocation}
        setDiscoveryLocation={setDiscoveryLocation}
        locationMode={locationMode}
        setLocationMode={setLocationMode}
        locationOptions={locationOptions}
        locationNotice={locationNotice}
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
  question: { gap: 8, paddingTop: 8 },
  questionTitle: { color: "#1A1A1A", fontSize: 16, fontWeight: "800" },
  questionSubtitle: {
    color: "#1A1A1A",
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "500",
  },
});
