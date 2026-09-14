import React, { useMemo, useState } from "react";
import {
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
  StyleSheet,
  View,
} from "react-native";
import { Species } from "../../../types";
import { useCollectionSpeciesList } from "../../../hooks/useCollectionSpeciesList";
import { CollectionGridRow } from "./components/CollectionGridRow";
import { CollectionHeaderBar } from "./components/CollectionHeaderBar";
import { CollectionHeroSection } from "./components/CollectionHeroSection";
import { WildlifeFilterChips } from "./components/WildlifeFilterChips";

const HERO_GAP = 21;

export function CollectionScreen() {
  const speciesList = useCollectionSpeciesList();

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

  const chipsRow = <WildlifeFilterChips />;

  const rows = useMemo(() => {
    const chunked: Species[][] = [];
    for (let i = 0; i < speciesList.length; i += 2)
      chunked.push(speciesList.slice(i, i + 2));
    return chunked;
  }, [speciesList]);

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
        renderItem={({ item: row }) => <CollectionGridRow items={row} />}
        ListHeaderComponent={
          <>
            <View style={{ height: headerHeight }} />
            <CollectionHeroSection
              waveWidth={waveWidth}
              heroHeight={heroHeight}
              onLayout={handleHeroLayout}
            />

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

      <CollectionHeaderBar
        stuck={stuck}
        onLayout={(e) => setHeaderHeight(e.nativeEvent.layout.height)}
      />

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
  collectionTabsSticky: { backgroundColor: "#FFFFFF", paddingTop: 10 },
  collectionTabsFixed: { position: "absolute", left: 0, right: 0 },
  collectionGridTopSpacer: { height: 14 },
});
