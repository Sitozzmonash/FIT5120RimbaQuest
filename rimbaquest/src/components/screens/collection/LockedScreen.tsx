import React from "react";
import { Image, ScrollView, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialIcons } from "@expo/vector-icons";
import { Species } from "../../../types";
import { imageFor } from "../../../constants/images";
import { Tap } from "../../common/Tap";

// TODO:: FIX THIS
// Same generic hint shown for every species, since there's no per-species
// discovery-hint field in the data model — just restyled to Figma's quoted
// "Discovery Hint:" format.
const GENERIC_DISCOVERY_HINT =
  "Explore parks and nature reserves in KL and the Klang Valley, then record a photo to unlock this Wildlife Card.";

export function LockedScreen({
  species,
  onBack,
}: {
  species: Species;
  onBack: () => void;
}) {
  return (
    <ScrollView
      style={styles.lockedRoot}
      contentContainerStyle={styles.lockedBody}
    >
      <View style={styles.lockedHeaderBar}>
        <Tap label="Go back" style={styles.lockedBackBtn} onPress={onBack}>
          <MaterialIcons name="chevron-left" size={20} color="#1B211C" />
        </Tap>
        <Text style={styles.lockedHeaderTitle}>Undiscovered</Text>
      </View>

      <View style={styles.lockedCard}>
        <View style={styles.lockedPreviewWrap}>
          <Image
            source={imageFor(species)!}
            style={styles.lockedPreviewImage}
            resizeMode="cover"
          />
          <View style={styles.lockedPreviewTint} pointerEvents="none" />
          <LinearGradient
            colors={[
              "rgba(255,255,255,0.4)",
              "rgba(255,255,255,0)",
              "rgba(255,255,255,0.4)",
            ]}
            locations={[0, 0.55, 1]}
            style={styles.lockedPreviewFade}
            pointerEvents="none"
          />
        </View>

        <View style={styles.lockedCardBody}>
          <View style={styles.lockedTitleColumn}>
            <View style={styles.lockedCategoryPill}>
              <Text style={styles.lockedCategoryPillText}>
                {species.category}
              </Text>
            </View>
            <Text style={styles.lockedCardName}>{species.common_name}</Text>
            <Text style={styles.lockedScientific}>
              {species.scientific_name}
            </Text>
          </View>
          {species.fun_fact ? (
            <Text style={styles.lockedDescription}>{species.fun_fact}</Text>
          ) : null}

          <View style={styles.lockedStatusPill}>
            <Text style={styles.lockedStatusPillText}>NOT DISCOVERED YET</Text>
          </View>

          <View style={styles.lockedCardDivider} />

          <View style={styles.lockedFieldTight}>
            <Text style={styles.lockedFieldLabel}>Discovery Hint:</Text>
            <Text style={styles.lockedFieldValue}>{species.habitat}</Text>
          </View>
          {/* <View style={styles.lockedField}>
            <Text style={styles.lockedFieldLabelLg}>Discovery Hint:</Text>
            <Text style={styles.lockedFieldValue}>
              &#8220;{GENERIC_DISCOVERY_HINT}&#8221;
            </Text>
          </View> */}
        </View>
      </View>

      <View style={styles.lockedMotivationBanner}>
        <MaterialIcons name="explore" size={24} color="#12B347" />
        <Text style={styles.lockedMotivationText}>
          Keep exploring! Take photo captures out in nature to unlock this
          creature!
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  lockedRoot: { flex: 1, backgroundColor: "#FFFFFF" },
  lockedBody: {
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 8,
    gap: 20,
    alignItems: "center",
  },
  lockedHeaderBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    minHeight: 56,
    width: "100%",
  },
  lockedBackBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#E2ECE4",
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  lockedHeaderTitle: { color: "#1B211C", fontSize: 22, fontWeight: "900" },

  // No border — the preview image bleeds full-width to the card's own rounded
  // edges (overflow: hidden on the card clips it), with the rest of the
  // content padded separately below in lockedCardBody.
  lockedCard: {
    width: "100%",
    borderRadius: 32,
    overflow: "hidden",
    backgroundColor: "#FFFFFF",
  },
  lockedPreviewWrap: { width: "100%", height: 220 },
  lockedPreviewImage: { width: "100%", height: "100%" },
  lockedCardBody: { width: "100%", padding: 16, gap: 16, alignItems: "center" },
  lockedPreviewTint: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(176,190,197,0.28)",
  },
  lockedPreviewFade: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  // Stacked and centered — badge, then name, then scientific name — instead
  // of name+badge sharing one row, which would overflow off-card for long
  // common names.
  lockedTitleColumn: { width: "100%", alignItems: "center", gap: 8 },
  lockedCardName: {
    width: "100%",
    color: "#1B211C",
    fontSize: 24,
    fontWeight: "900",
    textAlign: "center",
  },
  lockedCategoryPill: {
    backgroundColor: "#E2ECE4",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  lockedCategoryPillText: { color: "#656A6E", fontSize: 11, fontWeight: "800" },
  lockedScientific: {
    width: "100%",
    color: "#737373",
    fontSize: 13,
    fontStyle: "italic",
    textAlign: "center",
  },
  lockedDescription: {
    color: "#656A6E",
    fontSize: 14,
    fontStyle: "italic",
    textAlign: "center",
  },
  lockedStatusPill: {
    backgroundColor: "#E8541A",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  lockedStatusPillText: { color: "#FFFFFF", fontSize: 11, fontWeight: "800" },
  lockedCardDivider: { width: "100%", height: 1, backgroundColor: "#E2ECE4" },
  lockedField: { width: "100%", gap: 8 },
  lockedFieldTight: { width: "100%", gap: 6 },
  lockedFieldLabel: { color: "#1B211C", fontSize: 13, fontWeight: "800" },
  lockedFieldLabelLg: { color: "#1B211C", fontSize: 14, fontWeight: "800" },
  lockedFieldValue: { color: "#656A6E", fontSize: 13, lineHeight: 18 },
  lockedMotivationBanner: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#E8F5E9",
    borderRadius: 20,
    padding: 16
  },
  lockedMotivationText: {
    flex: 1,
    color: "#12B347",
    fontSize: 13,
    fontWeight: "600",
  },
});
