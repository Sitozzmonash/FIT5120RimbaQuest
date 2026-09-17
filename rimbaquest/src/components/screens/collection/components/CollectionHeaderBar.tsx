import React from "react";
import { LayoutChangeEvent, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { useNavigationStore } from "../../../../store/useNavigationStore";
import { Tap } from "../../../common/Tap";

export function CollectionHeaderBar({
  stuck,
  onLayout,
}: {
  stuck: boolean;
  onLayout: (e: LayoutChangeEvent) => void;
}) {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.collectionHeaderFixed,
        { paddingTop: insets.top },
        stuck && styles.collectionHeaderStickyCollapsed,
      ]}
      onLayout={onLayout}
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
          onPress={() => useNavigationStore.getState().goBack()}
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
  );
}

const styles = StyleSheet.create({
  collectionHeaderFixed: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: "#0A4D26",
    paddingBottom: 4,
  },
  collectionHeaderStickyCollapsed: { backgroundColor: "#FFFFFF" },
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
});
