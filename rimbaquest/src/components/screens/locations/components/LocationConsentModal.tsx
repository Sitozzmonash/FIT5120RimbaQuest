import React, { useState } from "react";
import { Linking, Platform, StyleSheet, Text } from "react-native";
import * as Location from "expo-location";
import { FONTS } from "../../../../constants/fonts";
import { HOME_MAP_IMAGES } from "../../../../constants/images";
import { useLocationsStore } from "../../../../store/useLocationsStore";
import { WoodModal } from "../../../common/game/WoodModal";

type Position = { latitude: number; longitude: number };

// Asks before the first location request of the app session (Share location pill, Map view, distance filter, nearest-first sort, camp card).
// When the phone or browser has stopped showing its own permission prompt,
// the modal points to Settings instead, so a refusal is never final.
export function useLocationConsent(onLocated?: (position: Position) => void) {
  const [visible, setVisible] = useState(false);
  const blocked = useLocationsStore((state) => state.locationBlocked);
  const requestDistances = useLocationsStore((state) => state.requestDistances);

  const share = async () => {
    setVisible(false);
    const position = await requestDistances();
    if (position) onLocated?.(position);
  };

  const openSettings = () => {
    setVisible(false);
    void Linking.openSettings();
  };

  // Browsers have no settings deep link; trying again picks up a changed
  // site permission.
  const canOpenSettings = blocked && Platform.OS !== "web";

  const modal = (
    <WoodModal
      visible={visible}
      onRequestClose={() => setVisible(false)}
      icon={HOME_MAP_IMAGES.iconDiscover}
      positive
      stars={false}
      title={blocked ? "Turn on location?" : "Share your location?"}
      message={
        blocked
          ? Platform.OS === "web"
            ? "Location is blocked for this site. Ask a grown-up to allow it in your browser's site settings, then try again."
            : "Location is turned off for RimbaQuest. Ask a grown-up to turn it on in Settings so we can find the places nearest to you."
          : "Sharing your location unlocks more features: the explore map, your camp, how far away each place is, and the nearest places first."
      }
      actionLabel={
        canOpenSettings
          ? "Open Settings"
          : blocked
            ? "Try Again"
            : "Share Location"
      }
      onAction={canOpenSettings ? openSettings : () => void share()}
      secondaryLabel="Not Now"
      onSecondary={() => setVisible(false)}
    >
      {blocked ? null : (
        <Text style={styles.note}>
          We only use it while the app is open and never save it.
        </Text>
      )}
    </WoodModal>
  );

  // Re-check first: the user may have turned location back on in Settings.
  const ask = async () => {
    // Already shared this session and still allowed: no need to ask again.
    if (useLocationsStore.getState().sessionConsent) {
      try {
        const permission = await Location.getForegroundPermissionsAsync();
        if (permission.granted) {
          await share();
          return;
        }
      } catch {
        // Fall through to the pop-up.
      }
      useLocationsStore.setState({ sessionConsent: false });
    }
    if (blocked) {
      try {
        const permission = await Location.getForegroundPermissionsAsync();
        if (permission.granted || permission.canAskAgain) {
          useLocationsStore.setState({ locationBlocked: false });
        }
      } catch {
        // Keep the current state if the check fails.
      }
    }
    setVisible(true);
  };

  return { ask: () => void ask(), modal };
}

const styles = StyleSheet.create({
  // Same emphasis as the note in the Home menu pop-ups (MenuConfirmModal).
  note: {
    fontFamily: FONTS.bodyBlack,
    color: "#1A1A1A",
    fontSize: 15,
    lineHeight: 21,
    textAlign: "center",
  },
});
