import React from "react";
import { StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { imageFor } from "../../../constants/images";
import { useNavigationStore } from "../../../store/useNavigationStore";
import { useSelectedSpeciesStore } from "../../../store/useSelectedSpeciesStore";
import { FitScrollView } from "../../common/FitScrollView";
import { GameScreenHeader } from "../../common/game/GameScreenHeader";
import { KeepExploringBanner } from "./components/locked/KeepExploringBanner";
import { LockedPhotoCard } from "./components/locked/LockedPhotoCard";
import { LockedSpeciesCard } from "./components/locked/LockedSpeciesCard";

export function LockedScreen() {
  const insets = useSafeAreaInsets();
  const species = useSelectedSpeciesStore((state) => state.selected);

  return (
    <View style={styles.root}>
      <GameScreenHeader
        title="Not Found Yet"
        onBack={() => useNavigationStore.getState().resetTo("collection")}
      />
      <FitScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: 20 + insets.bottom },
        ]}
      >
        <LockedPhotoCard image={imageFor(species)} />
        <LockedSpeciesCard species={species} />
        <KeepExploringBanner />
      </FitScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#0E4527" },
  content: { gap: 14, paddingTop: 16, paddingHorizontal: 16 },
});
