import React from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { FONTS } from "../../../../constants/fonts";
import { useDiscoveryStore } from "../../../../store/useDiscoveryStore";
import { ScaleTap } from "../../../common/ScaleTap";
import { DISCOVERY_COLORS } from "./discoveryTheme";

export function LocationAutoSection() {
  const locationMode = useDiscoveryStore((state) => state.locationMode);
  const discoveryLocation = useDiscoveryStore(
    (state) => state.discoveryLocation,
  );
  const resolvingLocation = useDiscoveryStore(
    (state) => state.resolvingLocation,
  );
  const active = locationMode === "auto";

  const status = resolvingLocation
    ? "Detecting your location..."
    : active && discoveryLocation
      ? discoveryLocation
      : "Tap to find where you are now";

  return (
    <ScaleTap
      label="Use my current location"
      style={[styles.option, active ? styles.optionActive : styles.optionIdle]}
      onPress={() => useDiscoveryStore.getState().setLocationMode("auto")}
      disabled={resolvingLocation}
      pressedScale={0.97}
    >
      <View style={[styles.icon, active && styles.iconActive]}>
        {resolvingLocation ? (
          <ActivityIndicator size="small" color="#FFFFFF" />
        ) : (
          <MaterialIcons name="my-location" size={20} color="#FFFFFF" />
        )}
      </View>
      <View style={styles.text}>
        <Text style={styles.title}>Use my current location</Text>
        <Text style={styles.status} numberOfLines={2}>
          {status}
        </Text>
      </View>
      {active && !resolvingLocation && discoveryLocation ? (
        <MaterialIcons
          name="check-circle"
          size={22}
          color={DISCOVERY_COLORS.green}
        />
      ) : null}
    </ScaleTap>
  );
}

const styles = StyleSheet.create({
  option: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 3,
    borderColor: DISCOVERY_COLORS.ink,
    borderRadius: 16,
  },
  optionIdle: { backgroundColor: "#FFFFFF", borderBottomWidth: 7 },
  optionActive: {
    backgroundColor: DISCOVERY_COLORS.mint,
    borderBottomWidth: 7,
  },
  icon: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#7C8A78",
    borderWidth: 2,
    borderColor: DISCOVERY_COLORS.ink,
    borderRadius: 20,
  },
  iconActive: { backgroundColor: DISCOVERY_COLORS.green },
  text: { flex: 1, gap: 2 },
  title: {
    fontFamily: FONTS.display,
    color: DISCOVERY_COLORS.heading,
    fontSize: 16,
  },
  status: {
    fontFamily: FONTS.bodyBold,
    color: DISCOVERY_COLORS.body,
    fontSize: 13,
  },
});
