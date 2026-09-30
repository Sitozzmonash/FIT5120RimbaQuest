import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { FONTS } from "../../../../constants/fonts";
import { useDisplayProgress } from "../../../../hooks/useDisplayProgress";
import { GAME_COLORS } from "../../../common/game/gameTheme";
import { LevelPill } from "../../../common/game/LevelPill";
import { CollectionLevelBar } from "./CollectionLevelBar";

export function CollectionProgressCard() {
  const displayProgress = useDisplayProgress();
  const percentage = displayProgress.total
    ? Math.min(
        100,
        Math.round((displayProgress.found / displayProgress.total) * 100),
      )
    : 0;

  return (
    <View>
      <View style={styles.topRow}>
        <Text style={styles.count}>
          {displayProgress.found}
          <Text style={styles.total}> / {displayProgress.total}</Text>
        </Text>
        <LevelPill level={displayProgress.level || 1} />
      </View>
      <Text style={styles.label}>ANIMALS FOUND</Text>
      <CollectionLevelBar
        found={displayProgress.found}
        total={displayProgress.total}
        percentage={percentage}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  count: {
    fontFamily: FONTS.display,
    color: GAME_COLORS.heading,
    fontSize: 30,
  },
  total: { color: "#7C8A78" },
  label: {
    marginTop: 4,
    fontFamily: FONTS.bodyBlack,
    color: GAME_COLORS.label,
    fontSize: 11,
    letterSpacing: 1,
  },
});
