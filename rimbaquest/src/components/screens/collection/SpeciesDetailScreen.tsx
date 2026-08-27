import React, { useEffect, useRef, useState } from "react";
import {
  Image,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { GalleryItem, Screen, Species } from "../../../types";
import { imageFor } from "../../../constants/images";
import { Tap } from "../../common/Tap";
import { AboutTab } from "./components/AboutTab";
import { BattleStatsTab } from "./components/BattleStatsTab";
import { FactsTab } from "./components/FactsTab";
import { GalleryTab } from "./components/GalleryTab";

const DETAIL_TABS: [Screen, string][] = [
  ["about", "About"],
  ["battle_stats", "Battle Stats"],
  ["facts", "Fun Facts"],
  ["gallery", "Gallery"],
];

export function SpeciesDetailScreen({
  species,
  screen,
  photos,
  onTabChange,
  onStartBattle,
  onBack,
}: {
  species: Species;
  screen: Screen;
  photos: GalleryItem[];
  onTabChange: (s: Screen) => void;
  onStartBattle: () => void;
  onBack: () => void;
}) {
  // Tab content lives in a horizontal, paging ScrollView so the user can swipe
  // left/right between tabs, in sync with tapping the tab labels above it.
  const [pageWidth, setPageWidth] = useState(0);
  const pagerRef = useRef<ScrollView>(null);
  const activeIndex = DETAIL_TABS.findIndex(([key]) => key === screen);

  useEffect(() => {
    if (pageWidth > 0 && activeIndex >= 0) {
      pagerRef.current?.scrollTo({
        x: activeIndex * pageWidth,
        animated: true,
      });
    }
    // Only re-sync when the active tab or measured width changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screen, pageWidth]);

  const handleSwipeEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (!pageWidth) return;
    const index = Math.round(e.nativeEvent.contentOffset.x / pageWidth);
    const clamped = Math.min(DETAIL_TABS.length - 1, Math.max(0, index));
    const next = DETAIL_TABS[clamped][0];
    if (next !== screen) onTabChange(next);
  };

  return (
    <View style={styles.detailRoot}>
      <View style={styles.detailHeaderBar}>
        <Tap label="Go back" style={styles.collectionBackBtn} onPress={onBack}>
          <MaterialIcons name="chevron-left" size={20} color="#FFFFFF" />
        </Tap>
        <Text numberOfLines={1} style={styles.detailHeaderTitle}>
          {species.common_name}
        </Text>
      </View>

      <Image
        source={imageFor(species)!}
        style={styles.detailHeroImage}
        resizeMode="cover"
      />

      <View style={styles.detailTabsRow}>
        {DETAIL_TABS.map(([key, label]) => {
          const active = screen === key;
          return (
            <Tap
              key={key}
              label={label}
              style={styles.detailTab}
              onPress={() => onTabChange(key)}
            >
              <Text
                style={[
                  styles.detailTabText,
                  active && styles.detailTabTextActive,
                ]}
              >
                {label}
              </Text>
              <View
                style={[
                  styles.detailTabUnderline,
                  active && styles.detailTabUnderlineActive,
                ]}
              />
            </Tap>
          );
        })}
      </View>

      <ScrollView
        ref={pagerRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        decelerationRate="fast"
        onLayout={(e) => setPageWidth(e.nativeEvent.layout.width)}
        onMomentumScrollEnd={handleSwipeEnd}
      >
        {pageWidth > 0 &&
          DETAIL_TABS.map(([key]) => (
            <ScrollView
              key={key}
              style={{ width: pageWidth }}
              contentContainerStyle={styles.detailBody}
              nestedScrollEnabled
            >
              {key === "about" && <AboutTab item={species} />}
              {key === "battle_stats" && (
                <BattleStatsTab item={species} onBattle={onStartBattle} />
              )}
              {key === "facts" && <FactsTab item={species} />}
              {key === "gallery" && <GalleryTab photos={photos} />}
            </ScrollView>
          ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  detailRoot: { flex: 1, backgroundColor: "#FFFFFF" },
  collectionBackBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#0A4D26",
    alignItems: "center",
    justifyContent: "center",
  },
  detailHeaderBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 20,
    marginTop: 8,
    minHeight: 56,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E2ECE4",
  },
  detailHeaderTitle: {
    flex: 1,
    color: "#1A1A1A",
    fontSize: 20,
    fontWeight: "900",
  },
  detailHeroImage: { width: "100%", height: 200 },
  detailTabsRow: {
    flexDirection: "row",
    gap: 24,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 4,
    backgroundColor: "#FFFFFF",
  },
  detailTab: { alignItems: "center", gap: 8 },
  detailTabText: { color: "#1A1A1A", fontSize: 14, fontWeight: "600" },
  detailTabTextActive: { fontWeight: "900" },
  detailTabUnderline: {
    height: 2,
    width: 36,
    borderRadius: 1,
    backgroundColor: "transparent",
  },
  detailTabUnderlineActive: { backgroundColor: "#78B833" },
  detailBody: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 32,
    backgroundColor: "#FFFFFF",
    flexGrow: 1,
  },
});
