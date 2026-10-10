import React, { useMemo } from "react";
import { StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { WILDLIFE_FILTERS } from "../../../constants/seed";
import { avatarImageFor, hasReferenceImage } from "../../../constants/images";
import { useDisplayProgress } from "../../../hooks/useDisplayProgress";
import { useNavigationStore } from "../../../store/useNavigationStore";
import { useSpeciesCatalogStore } from "../../../store/useSpeciesCatalogStore";
import { useUserStore } from "../../../store/useUserStore";
import { FitScrollView } from "../../common/FitScrollView";
import { GameScreenHeader } from "../../common/game/GameScreenHeader";
import { AnimalCardsCard } from "./components/AnimalCardsCard";
import { ProfileActions } from "./components/ProfileActions";
import { ProfileHero } from "./components/ProfileHero";
import { CategoryProgress } from "./profileProgress";
import { PROFILE_COLORS } from "./profileTheme";

export function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const currentUser = useUserStore((state) => state.currentUser);
  const discovered = useUserStore((state) => state.discovered);
  const species = useSpeciesCatalogStore((state) => state.species);
  const progress = useDisplayProgress();

  const categories = useMemo<CategoryProgress[]>(() => {
    const supportedSpecies = species.filter(hasReferenceImage);
    return WILDLIFE_FILTERS.filter((item) => item.id !== "All").map((item) => {
      const items = supportedSpecies.filter((s) => s.category === item.id);
      const found = items.filter((s) => discovered.includes(s.id)).length;
      return { id: item.id, label: item.label, found, total: items.length };
    });
  }, [species, discovered]);

  return (
    <View style={styles.root}>
      <GameScreenHeader
        title="My Profile"
        guide="profile"
        onBack={() => useNavigationStore.getState().goBack()}
      />
      <FitScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: 12 + insets.bottom },
        ]}
      >
        <View style={styles.main}>
          <ProfileHero
            avatarImage={avatarImageFor(currentUser.avatar)}
            name={currentUser.display_name}
            level={progress.level || currentUser.level}
          />
          <AnimalCardsCard
            found={progress.found}
            total={progress.total}
            categories={categories}
          />
          <ProfileActions />
        </View>
      </FitScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: PROFILE_COLORS.background },
  content: {
    flexGrow: 1,
    justifyContent: "space-between",
    gap: 16,
    paddingTop: 16,
    paddingHorizontal: 16,
  },
  main: { gap: 16 },
});
