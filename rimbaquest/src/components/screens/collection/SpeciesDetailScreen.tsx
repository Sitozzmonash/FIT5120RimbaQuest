import React, { useEffect, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { GalleryItem, Screen } from "../../../types";
import { imageFor } from "../../../constants/images";
import { useNavigationStore } from "../../../store/useNavigationStore";
import { useSelectedSpeciesStore } from "../../../store/useSelectedSpeciesStore";
import { useUserStore } from "../../../store/useUserStore";
import { useAbilityQuizStore } from "../../../store/useAbilityQuizStore";
import { useContinueLearningStore } from "../../../store/useContinueLearningStore";
import { GameScreenHeader } from "../../common/game/GameScreenHeader";
import { AboutTab } from "./components/AboutTab";
import { BattleStatsTab } from "./components/BattleStatsTab";
import { FactsTab } from "./components/FactsTab";
import { GalleryTab } from "./components/GalleryTab";
import { SpeciesChatDrawer } from "./components/SpeciesChatDrawer";
import { AbilityUnlockModal } from "./components/AbilityUnlockModal";
import { PerkUnlockedModal } from "./components/PerkUnlockedModal";
import { ChatFab } from "./components/detail/ChatFab";
import { DETAIL_COLORS } from "./components/detail/detailTheme";
import { ViewPhotoCard } from "./components/detail/ViewPhotoCard";
import { WoodenTab, WoodenTabBar } from "./components/detail/WoodenTabBar";

const DETAIL_TABS: WoodenTab<Screen>[] = [
  { key: "about", label: "About" },
  { key: "facts", label: "Fun Facts" },
  { key: "battle_stats", label: "Battle Stats" },
  { key: "gallery", label: "Gallery" },
];

const EMPTY_PHOTOS: GalleryItem[] = [];

export function SpeciesDetailScreen() {
  const species = useSelectedSpeciesStore((state) => state.selected);
  const screen = useNavigationStore((state) => state.screen);
  const photos = useUserStore(
    (state) => state.galleryPhotos[species.id] ?? EMPTY_PHOTOS,
  );
  const token = useUserStore((state) => state.accessToken);
  const childId = useUserStore((state) => state.currentUser.id);
  const insets = useSafeAreaInsets();

  const onTabChange = (next: Screen) =>
    useNavigationStore.getState().open(next);
  const onBack = () => useNavigationStore.getState().resetTo("collection");
  const onChatSend = (question: string) =>
    useUserStore.getState().chatWithSpecies(species.id, question);
  const [chatVisible, setChatVisible] = useState(false);
  const activeTab =
    DETAIL_TABS.find(({ key }) => key === screen)?.key ?? "about";

  useEffect(() => {
    void useAbilityQuizStore.getState().fetchProgression(species.id);
  }, [species.id, token]);

  useEffect(() => {
    useContinueLearningStore
      .getState()
      .recordActivity(childId, species.id, "view");
  }, [species.id, childId]);

  useEffect(() => {
    if (screen === "facts") {
      useContinueLearningStore
        .getState()
        .recordActivity(childId, species.id, "fun_facts");
    }
  }, [species.id, screen, childId]);

  return (
    <View style={styles.root}>
      <GameScreenHeader title={species.common_name} onBack={onBack} />

      <View style={styles.top}>
        <ViewPhotoCard name={species.common_name} image={imageFor(species)} />
        <WoodenTabBar
          tabs={DETAIL_TABS}
          active={activeTab}
          onChange={onTabChange}
        />
      </View>

      <ScrollView
        key={activeTab}
        contentContainerStyle={[
          styles.page,
          { paddingBottom: 40 + insets.bottom },
        ]}
      >
        {activeTab === "about" && <AboutTab item={species} />}
        {activeTab === "facts" && <FactsTab speciesId={species.id} />}
        {activeTab === "battle_stats" && <BattleStatsTab item={species} />}
        {activeTab === "gallery" && <GalleryTab photos={photos} />}
      </ScrollView>

      <ChatFab
        label={`Ask WildGuide about ${species.common_name}`}
        style={{ right: 20, bottom: 5 + insets.bottom }}
        onPress={() => setChatVisible(true)}
      />
      <SpeciesChatDrawer
        visible={chatVisible}
        species={species}
        childId={childId}
        onClose={() => setChatVisible(false)}
        onSendQuestion={onChatSend}
      />
      <AbilityUnlockModal />
      <PerkUnlockedModal species={species} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: DETAIL_COLORS.background },
  top: { gap: 12, paddingTop: 12, paddingHorizontal: 16 },
  page: { padding: 16, flexGrow: 1, paddingTop: 12 },
});
