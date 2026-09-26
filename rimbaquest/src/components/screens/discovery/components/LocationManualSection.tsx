import React from "react";
import { StyleSheet, TextInput, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { FONTS } from "../../../../constants/fonts";
import { useDiscoveryStore } from "../../../../store/useDiscoveryStore";
import { useLocationsStore } from "../../../../store/useLocationsStore";
import { DISCOVERY_COLORS } from "./discoveryTheme";

// Free-text place name. Typing here switches the sheet to a typed location.
export function LocationManualSection() {
  const locationMode = useDiscoveryStore((state) => state.locationMode);
  const discoveryLocation = useDiscoveryStore(
    (state) => state.discoveryLocation,
  );
  const spots = useLocationsStore((state) => state.locations);

  // Only show what the child typed; spot names and detected places have
  // their own rows above.
  const typed =
    locationMode === "manual" &&
    !spots.some((spot) => spot.name === discoveryLocation)
      ? discoveryLocation
      : "";

  const onChangeText = (text: string) => {
    const store = useDiscoveryStore.getState();
    if (store.locationMode !== "manual") store.setLocationMode("manual");
    store.setDiscoveryLocation(text);
  };

  return (
    <View style={[styles.inputBox, typed ? styles.inputBoxFilled : null]}>
      <View style={styles.insetShade} />
      <MaterialIcons
        name="edit-location-alt"
        size={19}
        color={DISCOVERY_COLORS.heading}
      />
      <TextInput
        style={styles.input}
        value={typed}
        onChangeText={onChangeText}
        placeholder="Type the name of a place"
        placeholderTextColor="rgba(11, 61, 34, 0.55)"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  inputBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    height: 50,
    paddingHorizontal: 12,
    backgroundColor: "#FFFFFF",
    borderWidth: 3,
    borderColor: DISCOVERY_COLORS.ink,
    borderRadius: 14,
    overflow: "hidden",
  },
  inputBoxFilled: { backgroundColor: DISCOVERY_COLORS.mint },
  insetShade: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 4,
    backgroundColor: "rgba(7, 60, 29, 0.08)",
  },
  input: {
    flex: 1,
    fontFamily: FONTS.bodyExtraBold,
    color: DISCOVERY_COLORS.heading,
    fontSize: 15,
    paddingVertical: 0,
    outlineWidth: 0,
  },
});
