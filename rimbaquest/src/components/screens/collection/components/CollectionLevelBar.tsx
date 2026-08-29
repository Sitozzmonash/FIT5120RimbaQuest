import React, { useState } from "react";
import {
  LayoutChangeEvent,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { ANIMALS_PER_LEVEL } from "../../../../constants/progression";

const VISIBLE_ANIMALS_CAP = 100;
const EDGE_FADE_WIDTH = 40;

export function CollectionLevelBar({
  found,
  total,
  percentage,
}: {
  found: number;
  total: number;
  percentage: number;
}) {
  const [containerWidth, setContainerWidth] = useState(0);
  const [scrollX, setScrollX] = useState(0);

  const fullTierCount = Math.floor(total / ANIMALS_PER_LEVEL);
  const tierCount = fullTierCount > 0 ? fullTierCount : 1;

  const tickMarks: number[] = [];
  for (let mark = ANIMALS_PER_LEVEL; mark < total; mark += ANIMALS_PER_LEVEL) {
    tickMarks.push(mark);
  }
  const tiers = Array.from({ length: tierCount }, (_, i) => {
    const from = i * ANIMALS_PER_LEVEL;
    const to = Math.min(total, from + ANIMALS_PER_LEVEL);
    const size = to - from;
    const inTier = Math.max(0, Math.min(size, found - from));
    return { level: i + 1, inTier, size };
  });

  const isScrollable = total > VISIBLE_ANIMALS_CAP;
  const contentWidth =
    isScrollable && containerWidth
      ? containerWidth * (total / VISIBLE_ANIMALS_CAP)
      : containerWidth;
  const maxScrollX = Math.max(0, contentWidth - containerWidth);
  const canScrollLeft = isScrollable && scrollX > 2;
  const canScrollRight = isScrollable && scrollX < maxScrollX - 2;

  const handleLayout = (e: LayoutChangeEvent) => {
    setContainerWidth(e.nativeEvent.layout.width);
  };
  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    setScrollX(e.nativeEvent.contentOffset.x);
  };

  return (
    <View style={styles.collectionLevelBarWrap} onLayout={handleLayout}>
      <ScrollView
        horizontal
        scrollEnabled={isScrollable}
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        contentContainerStyle={[
          styles.scrollContent,
          containerWidth ? { width: contentWidth } : undefined,
        ]}
      >
        <View style={styles.collectionProgressTrackOuter}>
          <View style={styles.collectionProgressTrack}>
            <View
              style={[
                styles.collectionProgressFill,
                { width: `${percentage}%` },
              ]}
            />
          </View>
          {tickMarks.map((mark) => (
            <View
              key={mark}
              style={[
                styles.collectionLevelTick,
                { left: `${(mark * 100) / total}%` },
              ]}
            >
              <View style={styles.collectionLevelTickDash} />
              <View style={styles.collectionLevelTickDash} />
              <View style={styles.collectionLevelTickDash} />
              <View style={styles.collectionLevelTickDash} />
            </View>
          ))}
        </View>
        <View style={styles.collectionLevelLabelsRow}>
          {tiers.map((tier) => (
            <View key={tier.level} style={styles.collectionLevelLabelCell}>
              <Text style={styles.collectionLevelLabelLv}>Lv{tier.level}</Text>
              <Text style={styles.collectionLevelLabelFraction}>
                {tier.inTier}/{tier.size}
              </Text>
            </View>
          ))}
        </View>
      </ScrollView>

      {canScrollLeft && (
        <LinearGradient
          colors={["#F4FCF6", "rgba(244,252,246,0)"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.edgeFade, styles.edgeFadeLeft]}
          pointerEvents="none"
        >
          <Text style={styles.edgeChevron}>‹‹</Text>
        </LinearGradient>
      )}
      {canScrollRight && (
        <LinearGradient
          colors={["rgba(244,252,246,0)", "#F4FCF6"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.edgeFade, styles.edgeFadeRight]}
          pointerEvents="none"
        >
          <Text style={styles.edgeChevron}>››</Text>
        </LinearGradient>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  collectionLevelBarWrap: {
    width: "100%",
    marginTop: 12,
    gap: 6,
    position: "relative",
  },
  scrollContent: { flexDirection: "column", gap: 6 },
  collectionProgressTrackOuter: {
    width: "100%",
    height: 10,
    position: "relative",
  },
  collectionProgressTrack: {
    width: "100%",
    height: 10,
    backgroundColor: "#D8EDD8",
    borderRadius: 5,
    overflow: "hidden",
  },
  collectionProgressFill: {
    height: "100%",
    backgroundColor: "#78B833",
    borderRadius: 5,
  },
  collectionLevelTick: {
    position: "absolute",
    top: -5,
    bottom: -5,
    width: 2,
    marginLeft: -1,
    justifyContent: "space-between",
  },
  collectionLevelTickDash: {
    width: 2,
    height: 3,
    borderRadius: 1,
    backgroundColor: "#E8541A",
  },
  collectionLevelLabelsRow: { flexDirection: "row" },
  collectionLevelLabelCell: { flex: 1, alignItems: "center", gap: 2 },
  collectionLevelLabelLv: { color: "#0A4D26", fontSize: 10, fontWeight: "800" },
  collectionLevelLabelFraction: {
    color: "#6A8A72",
    fontSize: 9,
    fontWeight: "700",
  },
  edgeFade: {
    position: "absolute",
    top: -8,
    height: 20,
    width: EDGE_FADE_WIDTH,
    justifyContent: "center",
    zIndex: 5,
  },
  edgeFadeLeft: { left: 0, alignItems: "flex-start", paddingLeft: 0 },
  edgeFadeRight: { right: 0, alignItems: "flex-end", paddingRight: 0 },
  edgeChevron: {
    color: "#78B833",
    fontSize: 17,
    fontWeight: "900",
    opacity: 0.85,
  },
});
