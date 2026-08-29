import React from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { UserProfile } from "../../../types";
import { WILDLIFE_FILTERS } from "../../../constants/seed";
import { avatarImageFor } from "../../../constants/images";
import { ProfileHeader } from "./components/ProfileHeader";
import { ProfileHero } from "./components/ProfileHero";
import { OverallProgressCard } from "./components/OverallProgressCard";
import { LogoutButton } from "./components/LogoutButton";

export function ProfileScreen({
  currentUser,
  displayProgress,
  discoveredSpeciesCount,
  onOpenEdit,
  onLogout,
  onBack,
}: {
  currentUser: UserProfile;
  displayProgress: { found: number; total: number; xp: number; level?: number };
  discoveredSpeciesCount: (cat: string) => { found: number; total: number };
  onOpenEdit: () => void;
  onLogout: () => void;
  onBack: () => void;
}) {
  const insets = useSafeAreaInsets();

  const categories = WILDLIFE_FILTERS.filter((item) => item.id !== "All").map(
    (item) => ({
      id: item.id,
      label: item.label,
      ...discoveredSpeciesCount(item.id),
    }),
  );

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={["#C8F0D8", "#E0F5E9", "#F0FAF4", "#E8F6EE"]}
        locations={[0, 0.3, 0.6, 1]}
        style={styles.gradientBg}
      />
      <View style={[styles.decoCircle1, { pointerEvents: "none" }]} />
      <View style={[styles.decoCircle2, { pointerEvents: "none" }]} />

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + 8, paddingBottom: 32 + insets.bottom },
        ]}
      >
        <ProfileHeader title="My Profile" onBack={onBack} onEdit={onOpenEdit} />

        <ProfileHero
          avatarImage={avatarImageFor(currentUser.avatar)}
          name={currentUser.display_name}
          level={displayProgress.level || currentUser.level}
        />

        <OverallProgressCard progress={displayProgress} categories={categories} />

        <LogoutButton onPress={onLogout} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
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
  content: { paddingHorizontal: 18, paddingTop: 8, paddingBottom: 32 },
});
