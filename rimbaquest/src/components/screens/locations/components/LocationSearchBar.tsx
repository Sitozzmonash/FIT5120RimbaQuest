import React from "react";
import { StyleSheet, TextInput, View } from "react-native";
import { FONTS } from "../../../../constants/fonts";
import { MaterialIcons } from "@expo/vector-icons";
import { useLocationsStore } from "../../../../store/useLocationsStore";
import { ScaleTap } from "../../../common/ScaleTap";
import { LOCATION_COLORS } from "../locationsTheme";

export function LocationSearchBar() {
  const search = useLocationsStore((state) => state.search);
  const setSearch = useLocationsStore((state) => state.setSearch);

  return (
    <View style={styles.section}>
      <View style={styles.pill}>
        {/* Inset shade along the top edge. */}
        <View style={styles.insetShade} />
        <MaterialIcons name="search" size={20} color="#9CA3AF" />
        <TextInput
          placeholder="Search locations or areas"
          placeholderTextColor="rgba(11, 61, 34, 0.75)"
          value={search}
          onChangeText={setSearch}
          autoCapitalize="none"
          style={styles.input}
        />
        {search.length > 0 && (
          <ScaleTap
            label="Clear search"
            style={styles.clear}
            onPress={() => setSearch("")}
          >
            <MaterialIcons
              name="close"
              size={16}
              color={LOCATION_COLORS.paper}
            />
          </ScaleTap>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { paddingHorizontal: 16, paddingVertical: 12 },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    height: 56,
    paddingHorizontal: 14,
    backgroundColor: LOCATION_COLORS.paper,
    borderWidth: 3,
    borderBottomWidth: 7,
    borderColor: LOCATION_COLORS.ink,
    borderRadius: 16,
    overflow: "hidden",
  },
  insetShade: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 4,
    backgroundColor: "rgba(7, 60, 29, 0.12)",
  },
  input: {
    flex: 1,
    color: LOCATION_COLORS.heading,
    fontSize: 15,
    fontFamily: FONTS.bodyBold,
    paddingVertical: 0,
  },
  clear: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: LOCATION_COLORS.forest,
  },
});
