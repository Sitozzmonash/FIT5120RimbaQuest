import React, { useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { FONTS } from "../../../../constants/fonts";
import { useDiscoveryStore } from "../../../../store/useDiscoveryStore";
import { useLocationsStore } from "../../../../store/useLocationsStore";
import { ScaleTap } from "../../../common/ScaleTap";
import { Tap } from "../../../common/Tap";
import { DISCOVERY_COLORS } from "./discoveryTheme";

// Dropdown of known wildlife spots; picking one sets the location.
export function SpotDropdown() {
  const [open, setOpen] = useState(false);
  const locationMode = useDiscoveryStore((state) => state.locationMode);
  const discoveryLocation = useDiscoveryStore(
    (state) => state.discoveryLocation,
  );
  const spots = useLocationsStore((state) => state.locations);

  const chosen =
    locationMode === "manual"
      ? spots.find((spot) => spot.name === discoveryLocation)
      : undefined;

  const pick = (name: string) => {
    const store = useDiscoveryStore.getState();
    store.setLocationMode("manual");
    store.setDiscoveryLocation(name);
    setOpen(false);
  };

  return (
    <View>
      <ScaleTap
        label={open ? "Close wildlife spots" : "Choose a wildlife spot"}
        style={[styles.field, chosen && styles.fieldChosen]}
        onPress={() => setOpen((value) => !value)}
        disabled={spots.length === 0}
        pressedScale={0.98}
      >
        <MaterialIcons name="park" size={19} color={DISCOVERY_COLORS.heading} />
        <Text
          style={[styles.value, !chosen && styles.placeholder]}
          numberOfLines={1}
        >
          {chosen?.name ??
            (spots.length
              ? "Choose a wildlife spot"
              : "No wildlife spots loaded")}
        </Text>
        <MaterialIcons
          name={open ? "expand-less" : "expand-more"}
          size={24}
          color={DISCOVERY_COLORS.heading}
        />
      </ScaleTap>

      {open ? (
        <View style={styles.list}>
          <ScrollView nestedScrollEnabled keyboardShouldPersistTaps="handled">
            {spots.map((spot, index) => {
              const selected = chosen?.id === spot.id;
              return (
                <Tap
                  key={spot.id}
                  label={spot.name}
                  style={[
                    styles.item,
                    index > 0 && styles.itemDivider,
                    selected && styles.itemSelected,
                  ]}
                  onPress={() => pick(spot.name)}
                >
                  <View style={styles.itemText}>
                    <Text style={styles.itemName} numberOfLines={1}>
                      {spot.name}
                    </Text>
                    {spot.area ? (
                      <Text style={styles.itemArea} numberOfLines={1}>
                        {spot.area}
                      </Text>
                    ) : null}
                  </View>
                  {selected ? (
                    <MaterialIcons
                      name="check"
                      size={20}
                      color={DISCOVERY_COLORS.green}
                    />
                  ) : null}
                </Tap>
              );
            })}
          </ScrollView>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    height: 50 + 4,
    paddingHorizontal: 12,
    backgroundColor: "#FFFFFF",
    borderWidth: 3,
    borderBottomWidth: 7,
    borderColor: DISCOVERY_COLORS.ink,
    borderRadius: 14,
  },
  fieldChosen: { backgroundColor: DISCOVERY_COLORS.mint },
  value: {
    flex: 1,
    fontFamily: FONTS.bodyExtraBold,
    color: DISCOVERY_COLORS.heading,
    fontSize: 15,
  },
  placeholder: { color: "rgba(11, 61, 34, 0.55)" },
  list: {
    maxHeight: 220,
    marginTop: 6,
    backgroundColor: "#FFFFFF",
    borderWidth: 3,
    borderColor: DISCOVERY_COLORS.ink,
    borderRadius: 14,
    overflow: "hidden",
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  itemDivider: { borderTopWidth: 2, borderTopColor: "#ECE2C8" },
  itemSelected: { backgroundColor: DISCOVERY_COLORS.mint },
  itemText: { flex: 1 },
  itemName: {
    fontFamily: FONTS.bodyExtraBold,
    color: DISCOVERY_COLORS.heading,
    fontSize: 14,
  },
  itemArea: {
    fontFamily: FONTS.bodyBold,
    color: DISCOVERY_COLORS.label,
    fontSize: 12,
  },
});
