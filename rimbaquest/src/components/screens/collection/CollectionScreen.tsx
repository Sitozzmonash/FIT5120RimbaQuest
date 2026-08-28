import React, { useMemo, useState } from "react";
import {
  FlatList,
  Image,
  NativeScrollEvent,
  NativeSyntheticEvent,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialIcons } from "@expo/vector-icons";
import { Species } from "../../../types";
import { HOME_IMAGES } from "../../../constants/images";
import { Tap } from "../../common/Tap";
import { CollectionCard } from "./components/CollectionCard";
import { CollectionLevelBar } from "./components/CollectionLevelBar";
import { CollectionWaveBackground } from "./components/CollectionWaveBackground";
import { WildlifeFilterChips } from "./components/WildlifeFilterChips";

const HERO_GAP = 21;

export function CollectionScreen({
  speciesList,
  discoveredIds,
  filter,
  setFilter,
  displayProgress,
  onSelectSpecies,
  onSelectLocked,
  onStartDiscovery,
  onBack,
}: {
  speciesList: Species[];
  discoveredIds: string[];
  filter: string;
  setFilter: (f: string) => void;
  displayProgress: { found: number; total: number; xp: number; level?: number };
  onSelectSpecies: (s: Species) => void;
  onSelectLocked: (s: Species) => void;
  onStartDiscovery: () => void;
  onBack: () => void;
}) {
  const insets = useSafeAreaInsets();
  const percentage = displayProgress.total
    ? Math.min(
        100,
        Math.round((displayProgress.found / displayProgress.total) * 100),
      )
    : 0;

  const [waveWidth, setWaveWidth] = useState(0);
  const [heroHeight, setHeroHeight] = useState(0);

  const handleHeroLayout = (e: {
    nativeEvent: { layout: { width: number; height: number } };
  }) => {
    setWaveWidth(e.nativeEvent.layout.width);
    setHeroHeight(e.nativeEvent.layout.height);
  };

  const [headerHeight, setHeaderHeight] = useState(0);
  const [stuck, setStuck] = useState(false);
  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (!heroHeight) return;
    const next = e.nativeEvent.contentOffset.y >= heroHeight + HERO_GAP - 1;
    setStuck((prev) => (prev === next ? prev : next));
  };

  const chipsRow = <WildlifeFilterChips filter={filter} onSelect={setFilter} />;

  const rows = useMemo(() => {
    const chunked: Species[][] = [];
    for (let i = 0; i < speciesList.length; i += 2)
      chunked.push(speciesList.slice(i, i + 2));
    return chunked;
  }, [speciesList]);

  const renderCard = (item: Species) => {
    const discovered = discoveredIds.includes(item.id);
    return (
      <CollectionCard
        key={item.id}
        species={item}
        discovered={discovered}
        onPress={() =>
          discovered ? onSelectSpecies(item) : onSelectLocked(item)
        }
      />
    );
  };

  return (
    <View style={styles.collectionRoot}>
      <FlatList
        style={styles.collectionScroll}
        data={rows}
        keyExtractor={(row, index) => row[0]?.id ?? `row-${index}`}
        initialNumToRender={6}
        maxToRenderPerBatch={6}
        windowSize={7}
        removeClippedSubviews
        showsVerticalScrollIndicator={false}
        bounces={false}
        overScrollMode="never"
        contentContainerStyle={styles.collectionScrollContent}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        renderItem={({ item: row }) => (
          <View style={styles.collectionGridRow}>
            {row.map(renderCard)}
            {row.length === 1 && <View style={{ flex: 1 }} />}
          </View>
        )}
        ListHeaderComponent={
          <>
            <View style={{ height: headerHeight }} />
            <View
              style={styles.collectionHeroSection}
              onLayout={handleHeroLayout}
            >
              <CollectionWaveBackground
                width={waveWidth}
                heroHeight={heroHeight}
              />

              <View style={styles.collectionProgressCardWrap}>
                <View style={styles.collectionProgressCard}>
                  <LinearGradient
                    colors={["#FFFFFF", "#F4FCF6"]}
                    style={styles.collectionProgressCardGradient}
                  />
                  <View style={styles.collectionProgressTopRow}>
                    <Text style={styles.collectionProgressCount}>
                      {displayProgress.found} / {displayProgress.total}
                    </Text>
                    <View style={styles.collectionLevelPill}>
                      <Text style={styles.collectionLevelPillText}>
                        LV. {displayProgress.level || 1} TRACKER
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.collectionProgressLabel}>
                    Wildlife Discovered
                  </Text>
                  <CollectionLevelBar
                    found={displayProgress.found}
                    total={displayProgress.total}
                    percentage={percentage}
                  />
                </View>
              </View>

              <View style={styles.collectionLevelUpBannerWrap}>
                <View style={styles.collectionLevelUpBanner}>
                  <View style={styles.collectionLevelUpCopy}>
                    <Text style={styles.collectionLevelUpTitle}>
                      Capture More
                    </Text>
                    <Text style={styles.collectionLevelUpSubtitle}>
                      Unlock more wildlife species.
                    </Text>
                  </View>
                </View>
                <Tap
                  label="Go to Discover to capture more wildlife"
                  style={styles.collectionCaptureDecor}
                  onPress={onStartDiscovery}
                >
                  <Image
                    source={HOME_IMAGES.tileCapture}
                    style={styles.collectionCaptureImage}
                    resizeMode="contain"
                  />
                </Tap>
              </View>
            </View>

            <View style={{ height: HERO_GAP }} />

            <View
              style={styles.collectionTabsSticky}
              pointerEvents={stuck ? "none" : "auto"}
            >
              <View style={stuck ? { opacity: 0 } : undefined}>{chipsRow}</View>
            </View>
            <View style={styles.collectionGridTopSpacer} />
          </>
        }
      />

      <View
        style={[
          styles.collectionHeaderFixed,
          { paddingTop: insets.top },
          stuck && styles.collectionHeaderStickyCollapsed,
        ]}
        onLayout={(e) => setHeaderHeight(e.nativeEvent.layout.height)}
      >
        <View style={styles.collectionHeaderBar}>
          <Tap
            label="Go back"
            style={[
              styles.collectionBackBtn,
              stuck
                ? styles.collectionBackBtnOnLight
                : styles.collectionBackBtnOnDark,
            ]}
            onPress={onBack}
          >
            <MaterialIcons
              name="chevron-left"
              size={20}
              color={stuck ? "#1B211C" : "#FFFFFF"}
            />
          </Tap>
          <Text
            style={[
              styles.collectionHeaderTitle,
              !stuck && styles.collectionHeaderTitleOnDark,
            ]}
          >
            My Collection
          </Text>
        </View>
      </View>

      {stuck && (
        <View
          style={[
            styles.collectionTabsSticky,
            styles.collectionTabsFixed,
            { top: headerHeight },
          ]}
        >
          {chipsRow}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  collectionRoot: { flex: 1, backgroundColor: "#FFFFFF" },
  collectionScroll: { flex: 1 },
  collectionScrollContent: { paddingBottom: 32 },
  collectionHeaderFixed: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: "#0A4D26",
    paddingBottom: 4,
  },
  collectionHeaderStickyCollapsed: { backgroundColor: "#FFFFFF" },
  collectionHeroSection: { position: "relative" },
  collectionHeaderBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 20,
    minHeight: 56,
  },
  collectionBackBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#0A4D26",
    alignItems: "center",
    justifyContent: "center",
  },
  collectionBackBtnOnDark: {
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.6)",
  },
  collectionBackBtnOnLight: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2ECE4",
  },
  collectionHeaderTitle: { color: "#1A1A1A", fontSize: 22, fontWeight: "900" },
  collectionHeaderTitleOnDark: { color: "#FFFFFF" },
  collectionProgressCardWrap: {
    position: "relative",
    marginHorizontal: 16,
    marginBottom: 18,
  },
  collectionProgressCard: {
    borderRadius: 28,
    borderWidth: 1,
    borderColor: "#E2ECE4",
    padding: 20,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  collectionProgressCardGradient: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  collectionLevelUpBannerWrap: {
    position: "relative",
    marginHorizontal: 24,
    marginBottom: 18,
    paddingTop: 8,
  },
  collectionLevelUpBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  collectionLevelUpCopy: { flex: 1, gap: 4 },
  collectionLevelUpTitle: { color: "#FFFFFF", fontSize: 20, fontWeight: "900" },
  collectionLevelUpSubtitle: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 13,
    fontWeight: "600",
    lineHeight: 18,
  },
  collectionCaptureDecor: {
    position: "absolute",
    bottom: -28,
    right: -6,
    width: 130,
    height: 92,
    zIndex: 3,
  },
  collectionCaptureImage: { width: "100%", height: "100%" },
  collectionProgressTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  collectionProgressCount: {
    color: "#0A4D26",
    fontSize: 28,
    fontWeight: "900",
  },
  collectionLevelPill: {
    backgroundColor: "#E8541A",
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  collectionLevelPillText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "900",
  },
  collectionProgressLabel: {
    color: "#173F6B",
    fontSize: 14,
    fontWeight: "700",
    marginTop: 12,
  },
  collectionTabsSticky: { backgroundColor: "#FFFFFF", paddingTop: 10 },
  collectionTabsFixed: { position: "absolute", left: 0, right: 0 },
  collectionGridRow: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  collectionGridTopSpacer: { height: 14 },
});
