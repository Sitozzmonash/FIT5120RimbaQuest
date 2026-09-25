import React, { useMemo } from "react";
import { StyleSheet, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { WILDLIFE_FILTERS } from "../../../constants/seed";
import { avatarImageFor, hasReferenceImage } from "../../../constants/images";
import { useDisplayProgress } from "../../../hooks/useDisplayProgress";
import { useSpeciesCatalogStore } from "../../../store/useSpeciesCatalogStore";
import { useUserStore } from "../../../store/useUserStore";
import { ProfileHeader } from "./components/ProfileHeader";
import { ProfileHero } from "./components/ProfileHero";
import { OverallProgressCard } from "./components/OverallProgressCard";
import { ProfileActions } from "./components/ProfileActions";

export function ProfileScreen() {
  const insets = useSafeAreaInsets();

  const currentUser = useUserStore((state) => state.currentUser);
  const discovered = useUserStore((state) => state.discovered);
  const species = useSpeciesCatalogStore((state) => state.species);
  const displayProgress = useDisplayProgress();

  const categories = useMemo(() => {
    const supportedSpecies = species.filter(hasReferenceImage);
    return WILDLIFE_FILTERS.filter((item) => item.id !== "All").map((item) => {
      const items = supportedSpecies.filter((s) => s.category === item.id);
      const found = items.filter((s) => discovered.includes(s.id)).length;
      return { id: item.id, label: item.label, found, total: items.length };
    });
  }, [species, discovered]);

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={["#C8F0D8", "#E0F5E9", "#F0FAF4", "#E8F6EE"]}
        locations={[0, 0.3, 0.6, 1]}
        style={styles.gradientBg}
      />
      <View style={[styles.decoCircle1, { pointerEvents: "none" }]} />
      <View style={[styles.decoCircle2, { pointerEvents: "none" }]} />

      <View
        style={[
          styles.content,
          { paddingTop: insets.top + 8, paddingBottom: 16 + insets.bottom },
        ]}
      >
        <ProfileHeader title="My Profile" />

        <ProfileHero
          avatarImage={avatarImageFor(currentUser.avatar)}
          name={currentUser.display_name}
          level={displayProgress.level || currentUser.level}
        />

        <OverallProgressCard
          progress={displayProgress}
          categories={categories}
        />

        <ProfileActions />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, overflow: "hidden" },
  gradientBg: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0 },
  decoCircle1: {
    position: "absolute",
    left: -30,
    top: -40,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: "#78B833",
    opacity: 0.12,
  },
  decoCircle2: {
    position: "absolute",
    right: -40,
    bottom: 40,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: "#FFC314",
    opacity: 0.08,
  },
  content: { flex: 1, paddingHorizontal: 18, paddingTop: 8, paddingBottom: 32 },
});
