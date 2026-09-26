import React, { useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { FONTS } from "../../../constants/fonts";
import { useDiscoveryStore } from "../../../store/useDiscoveryStore";
import { useSelectedSpeciesStore } from "../../../store/useSelectedSpeciesStore";
import { WoodCard } from "../../common/game/WoodCard";
import { DiscoveryBottomNav } from "./components/DiscoveryBottomNav";
import { DiscoveryHeader } from "./components/DiscoveryHeader";
import { DISCOVERY_COLORS } from "./components/discoveryTheme";
import { LocationEditSheet } from "./components/LocationEditSheet";
import { LocationRow } from "./components/LocationRow";
import { PhotoPreview } from "./components/PhotoPreview";
import { PlankSection } from "./components/PlankSection";

export function ConfirmScreen() {
  const insets = useSafeAreaInsets();
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
  const busy = finalizing || reporting;
  const hasLocation = Boolean(discoveryLocation.trim()) && !resolvingLocation;

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

  return (
    <View style={styles.page}>
      <DiscoveryHeader
        title="Confirm Discovery"
        confirmDiscard
        onDiscard={() => useDiscoveryStore.getState().discardAndExit()}
        disabled={busy}
      />

      <View style={[styles.body, { paddingBottom: 16 + insets.bottom }]}>
        <WoodCard
          title={selected.common_name}
          largeTitle
          titleAccessory={
            <View style={styles.categoryPill}>
              <Text style={styles.categoryText}>{selected.category}</Text>
            </View>
          }
          style={styles.card}
          bodyStyle={styles.cardBody}
        >
          <ScrollView
            contentContainerStyle={styles.scroll}
            showsVerticalScrollIndicator={false}
          >
            <PhotoPreview />

            <PlankSection title="Pick your location">
              <LocationRow
                value={locationValue}
                onPress={() => setEditingLocation(true)}
              />
            </PlankSection>

            <PlankSection
              title="Is this the species you saw?"
              background="#FFE7A8"
            >
              <Text style={styles.question}>
                Our photo helper makes its best guess, but it can be wrong.
                Double-check the photo and details before you record your
                discovery.
              </Text>
            </PlankSection>

            {saveError ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{saveError}</Text>
              </View>
            ) : null}
          </ScrollView>

          <DiscoveryBottomNav
            onBack={() => void useDiscoveryStore.getState().reportAndExit()}
            backLabel={reporting ? "Sending..." : "No"}
            backDisabled={busy}
            nextLabel={finalizing ? "Saving..." : "Confirm & Save"}
            nextDisabled={busy || !hasLocation}
            nextLoading={finalizing}
            onNext={() => void handleConfirm()}
          />
        </WoodCard>
      </View>

      <LocationEditSheet
        visible={editingLocation}
        onClose={() => setEditingLocation(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: DISCOVERY_COLORS.confirmBg },
  body: { flex: 1, paddingTop: 12, paddingHorizontal: 8 },
  card: { flex: 1, borderRadius: 24 },
  cardBody: { flex: 1, gap: 12, paddingTop: 4 },
  scroll: { gap: 14, paddingBottom: 12, paddingHorizontal: 2 },
  categoryPill: {
    paddingHorizontal: 10,
    paddingVertical: 2,
    backgroundColor: DISCOVERY_COLORS.mint,
    borderWidth: 2,
    borderColor: DISCOVERY_COLORS.ink,
    borderRadius: 999,
  },
  categoryText: {
    fontFamily: FONTS.bodyBlack,
    color: DISCOVERY_COLORS.mintText,
    fontSize: 12,
  },
  question: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontFamily: FONTS.bodyExtraBold,
    color: "#5A3810",
    fontSize: 13,
    lineHeight: 18,
  },
  errorBox: {
    padding: 12,
    backgroundColor: "#FCE8E8",
    borderWidth: 2,
    borderColor: DISCOVERY_COLORS.ink,
    borderRadius: 14,
  },
  errorText: {
    fontFamily: FONTS.bodyBold,
    color: "#B3261E",
    fontSize: 13,
    textAlign: "center",
  },
});
