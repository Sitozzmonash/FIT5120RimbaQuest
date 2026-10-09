import React, { useEffect, useState } from "react";
import { Modal, StyleSheet, Text, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { FONTS } from "../../../../constants/fonts";
import { useDiscoveryStore } from "../../../../store/useDiscoveryStore";
import { useLocationsStore } from "../../../../store/useLocationsStore";
import { GameButton } from "../../../common/game/GameButton";
import { WoodenTab, WoodenTabBar } from "../../../common/game/WoodenTabBar";
import { outlinedTitleStyle } from "../../../common/game/gameTheme";
import { ScaleTap } from "../../../common/ScaleTap";
import { DISCOVERY_COLORS } from "./discoveryTheme";
import { LocationAutoSection } from "./LocationAutoSection";
import { LocationManualSection } from "./LocationManualSection";
import { SpotDropdown } from "./SpotDropdown";

type LocationTab = "auto" | "manual" | "select";

const TABS: WoodenTab<LocationTab>[] = [
  { key: "auto", label: "Auto" },
  { key: "manual", label: "Manual" },
  { key: "select", label: "Select" },
];

export function LocationEditSheet({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  const locationNotice = useDiscoveryStore((state) => state.locationNotice);
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState<LocationTab>("auto");

  // Each time the sheet opens, start on the tab that matches the current answer.
  useEffect(() => {
    if (!visible) return;
    const { locationMode, discoveryLocation } = useDiscoveryStore.getState();
    const isSpot = useLocationsStore
      .getState()
      .locations.some((spot) => spot.name === discoveryLocation);
    setTab(locationMode === "auto" ? "auto" : isSpot ? "select" : "manual");
  }, [visible]);

  const changeTab = (next: LocationTab) => {
    setTab(next);
    // Opening Auto looks the location up straight away.
    if (next === "auto") useDiscoveryStore.getState().setLocationMode("auto");
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.title} numberOfLines={1}>
              Where Did You Find It?
            </Text>
            <ScaleTap label="Close" style={styles.close} onPress={onClose}>
              <MaterialIcons
                name="close"
                size={22}
                color={DISCOVERY_COLORS.ink}
              />
            </ScaleTap>
          </View>

          <View style={[styles.body, { paddingBottom: 20 + insets.bottom }]}>
            <WoodenTabBar tabs={TABS} active={tab} onChange={changeTab} />

            {locationNotice ? (
              <Text style={styles.notice}>{locationNotice}</Text>
            ) : null}

            {tab === "auto" && <LocationAutoSection />}
            {tab === "manual" && <LocationManualSection />}
            {tab === "select" && <SpotDropdown />}

            <GameButton label="Done" onPress={onClose} style={styles.done} />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(8, 22, 14, 0.45)",
  },
  sheet: {
    width: "100%",
    maxWidth: 520,
    alignSelf: "center",
    backgroundColor: DISCOVERY_COLORS.paper,
    borderWidth: 3,
    borderBottomWidth: 0,
    borderColor: DISCOVERY_COLORS.ink,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingTop: 14,
    paddingBottom: 14,
    paddingHorizontal: 20,
    backgroundColor: DISCOVERY_COLORS.forest,
    borderBottomWidth: 3,
    borderBottomColor: DISCOVERY_COLORS.ink,
  },
  title: {
    ...outlinedTitleStyle,
    textShadowColor: DISCOVERY_COLORS.ink,
    flex: 1,
    fontSize: 20,
  },
  close: {
    width: 40,
    height: 40 + 3,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: DISCOVERY_COLORS.paper,
    borderWidth: 3,
    borderBottomWidth: 6,
    borderColor: DISCOVERY_COLORS.ink,
    borderRadius: 20,
  },
  body: { gap: 14, paddingTop: 18, paddingHorizontal: 20 },
  notice: {
    padding: 10,
    backgroundColor: "#FEF3C7",
    borderWidth: 2,
    borderColor: "#F59E0B",
    borderRadius: 12,
    overflow: "hidden",
    fontFamily: FONTS.bodyBold,
    color: "#92400E",
    fontSize: 12,
    lineHeight: 17,
  },
  done: { marginTop: 4 },
});
