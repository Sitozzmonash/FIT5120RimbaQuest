import React from "react";
import { LayoutChangeEvent, StyleSheet, View } from "react-native";
import { useNavigationStore } from "../../../../store/useNavigationStore";
import { GameScreenHeader } from "../../../common/game/GameScreenHeader";

export function CollectionHeaderBar({
  onLayout,
}: {
  onLayout: (e: LayoutChangeEvent) => void;
}) {
  return (
    <View style={styles.fixed} onLayout={onLayout}>
      <GameScreenHeader
        title="My Collection"
        onBack={() => useNavigationStore.getState().goBack()}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  fixed: { position: "absolute", top: 0, left: 0, right: 0 },
});
