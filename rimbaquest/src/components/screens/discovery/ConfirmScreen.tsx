import React, { useState } from "react";
import { Image, ScrollView, StyleSheet, Text, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { LocationItem, LocationMode, Species } from "../../../types";
import { imageFor } from "../../../constants/images";
import { DiscoveryHeader } from "./components/DiscoveryHeader";
import { DiscoveryBottomNav } from "./components/DiscoveryBottomNav";
import { PhotoPreview } from "./components/PhotoPreview";
import { InfoCard } from "./components/InfoCard";
import { LocationEditSheet } from "./components/LocationEditSheet";

// Step 4: review the photo, species and location before saving. The
// LOCATION card is tappable and opens the automatic/manual picker; DATE &
// TIME is a read-only snapshot of when this review screen was opened.
export function ConfirmScreen({
  photo,
  selected,
  candidates,
  discoveryLocation,
  setDiscoveryLocation,
  locationMode,
  setLocationMode,
  resolvingLocation,
  locationOptions,
  locationNotice,
  saveError,
  saving,
  reporting,
  onConfirm,
  onReport,
  onBack,
  onDiscard,
}: {
  photo: { uri: string };
  selected: Species;
  candidates: Species[];
  discoveryLocation: string;
  setDiscoveryLocation: (s: string) => void;
  locationMode: LocationMode;
  setLocationMode: (m: LocationMode) => void;
  resolvingLocation?: boolean;
  locationOptions: LocationItem[];
  locationNotice: string | null;
  saveError: string | null;
  saving: boolean;
  reporting: boolean;
  onConfirm: () => void;
  onReport: () => void;
  onBack: () => void;
  onDiscard: () => void;
}) {
  const [editingLocation, setEditingLocation] = useState(false);

  const locationValue =
    locationMode === "auto"
      ? discoveryLocation ||
        (resolvingLocation ? "Detecting location..." : "Using current device location")
      : discoveryLocation || "Tap to set location";

  return (
    <View style={styles.page}>
      <DiscoveryHeader
        title="Confirm Discovery"
        onBack={onBack}
        confirmDiscard
        onDiscard={onDiscard}
        disabled={saving || reporting}
      />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.aiNotice}>
          <MaterialIcons name="info-outline" size={20} color="#667085" />
          <Text style={styles.aiNoticeText}>AI powered detection results may not always be accurate</Text>
        </View>

        <PhotoPreview photo={photo} />

        <View style={styles.categoryPill}>
          <Text style={styles.categoryPillText}>{selected.category}</Text>
        </View>

        <Text style={styles.matchTitle}>Your discovery matches this species</Text>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.candidateRow}>
          {candidates.map((item) => {
            const verified = item.id === selected.id;
            return (
              <View key={item.id} style={[styles.candidateCard, verified && styles.candidateCardVerified]}>
                <Image source={imageFor(item)!} style={styles.candidateImage} resizeMode="cover" />
                <View style={styles.candidateShade} />
                <Text style={styles.candidateName} numberOfLines={2}>{item.common_name}</Text>
                {verified ? (
                  <View style={styles.verifiedBadge}>
                    <MaterialIcons name="check" size={16} color="#FFFFFF" />
                  </View>
                ) : null}
              </View>
            );
          })}
        </ScrollView>

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

        <View style={styles.question}>
          <Text style={styles.questionTitle}>Is this the species you saw?</Text>
          <Text style={styles.questionSubtitle}>
            Double-check the photo and details before you record your discovery.
          </Text>
        </View>
      </ScrollView>

      <DiscoveryBottomNav
        onBack={onReport}
        backLabel={reporting ? "Reporting..." : "No, Report"}
        backDisabled={saving || reporting}
        nextLabel={saving ? "Saving..." : "Yes and Save"}
        nextDisabled={saving || reporting}
        onNext={onConfirm}
      />

      <LocationEditSheet
        visible={editingLocation}
        onClose={() => setEditingLocation(false)}
        discoveryLocation={discoveryLocation}
        setDiscoveryLocation={setDiscoveryLocation}
        locationMode={locationMode}
        setLocationMode={setLocationMode}
        resolvingLocation={resolvingLocation}
        locationOptions={locationOptions}
        locationNotice={locationNotice}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: "#FFFFFF" },
  content: { padding: 16, gap: 16 },
  aiNotice: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 13,
    borderWidth: 1,
    borderColor: "#D7DADE",
    borderRadius: 15,
    backgroundColor: "#F5F6F7",
  },
  aiNoticeText: { flex: 1, color: "#344054", fontSize: 13, lineHeight: 18, fontWeight: "700" },
  categoryPill: {
    alignSelf: "flex-start",
    backgroundColor: "#E8F5EE",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  categoryPillText: { color: "#12B347", fontSize: 12, fontWeight: "800" },
  matchTitle: { color: "#1A1A1A", fontSize: 20, lineHeight: 26, fontWeight: "900" },
  candidateRow: { alignItems: "center", paddingHorizontal: 24, paddingVertical: 8, gap: 8 },
  candidateCard: {
    width: 84,
    height: 132,
    borderRadius: 14,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#D8E6DC",
    backgroundColor: "#E7EDE9",
  },
  candidateCardVerified: { width: 116, height: 148, borderWidth: 3, borderColor: "#12B347" },
  candidateImage: { width: "100%", height: "100%" },
  candidateShade: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.2)" },
  candidateName: {
    position: "absolute",
    left: 6,
    right: 6,
    bottom: 8,
    color: "#FFFFFF",
    fontSize: 11,
    lineHeight: 13,
    fontWeight: "900",
    textAlign: "center",
    textShadowColor: "rgba(0,0,0,0.75)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  verifiedBadge: {
    position: "absolute",
    top: 7,
    right: 7,
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#087B35",
  },
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
