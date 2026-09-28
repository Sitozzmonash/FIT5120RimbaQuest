import React, { useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { imageFor } from "../../../constants/images";
import { useDiscoveryStore } from "../../../store/useDiscoveryStore";
import { useNavigationStore } from "../../../store/useNavigationStore";
import { useSelectedSpeciesStore } from "../../../store/useSelectedSpeciesStore";
import { FitScrollView } from "../../common/FitScrollView";
import { GameButton } from "../../common/game/GameButton";
import { outlinedTitleStyle } from "../../common/game/gameTheme";
import { GameRibbon } from "../../common/game/GameRibbon";
import { SpinningRays } from "../../common/game/SpinningRays";
import { CollectibleCard } from "./components/CollectibleCard";
import { DISCOVERY_COLORS } from "./components/discoveryTheme";
import { SuccessSummary } from "./components/SuccessSummary";
import { playCaptureSuccess } from "@/utils/sounds";

function formatDate(iso: string | null): string {
  const d = iso ? new Date(iso) : new Date();
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

export function SuccessScreen() {
  const insets = useSafeAreaInsets();
  const selected = useSelectedSpeciesStore((state) => state.selected);
  const photoUri = useDiscoveryStore((state) => state.photoUri);
  const discoveryLocation = useDiscoveryStore(
    (state) => state.discoveryLocation,
  );
  const firstDiscovery = useDiscoveryStore((state) => state.firstDiscovery);
  const recordedAt = useDiscoveryStore((state) => state.discoveryRecordedAt);

  const rows = [
    // { label: "Date Found", value: formatDate(recordedAt) },
    { label: "Discovery Status", value: "Confirmed" },
    ...(discoveryLocation
      ? [{ label: "Location", value: discoveryLocation }]
      : []),
  ];

  useEffect(() => {
    void playCaptureSuccess();
  }, []);

  return (
    <View style={styles.page}>
      <View style={[styles.raysWrap, { pointerEvents: "none" }]}>
        <SpinningRays style={styles.rays} />
      </View>

      <FitScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + 16, paddingBottom: 24 + insets.bottom },
        ]}
      >
        <Text style={styles.title}>Success!</Text>

        <View style={styles.hero}>
          <GameRibbon
            label={
              firstDiscovery ? "Wildlife Discovered!" : "Already Collected!"
            }
          />
          <CollectibleCard
            name={selected.common_name}
            category={selected.category}
            photo={photoUri ? { uri: photoUri } : imageFor(selected)}
          />
        </View>

        <View style={styles.bottom}>
          <SuccessSummary rows={rows} />
          <View style={styles.actions}>
            <GameButton
              label="View Card"
              size="m"
              onPress={() => useNavigationStore.getState().open("about")}
            />
            <GameButton
              label="Record Another Discovery"
              variant="secondary"
              onPress={() => useDiscoveryStore.getState().start()}
            />
          </View>
        </View>
      </FitScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: DISCOVERY_COLORS.forest,
    overflow: "hidden",
  },
  raysWrap: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
  rays: { marginTop: -120 },
  content: {
    flexGrow: 1,
    justifyContent: "space-between",
    gap: 20,
    paddingHorizontal: 24,
  },
  title: {
    ...outlinedTitleStyle,
    textShadowColor: DISCOVERY_COLORS.ink,
    fontSize: 24,
    textAlign: "center",
  },
  hero: { alignItems: "center", gap: 6 },
  bottom: { gap: 24 },
  actions: { gap: 8 },
});
