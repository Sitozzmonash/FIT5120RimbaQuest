import React, { useRef } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text } from "react-native";
import { SvgXml } from "react-native-svg";
import { FONTS } from "../../../../constants/fonts";
import { LOCATION_CATEGORY_FILTERS } from "../../../../constants/seed";
import { useLocationsStore } from "../../../../store/useLocationsStore";
import { LocationViewMode } from "../../../../types";
import {
  DistanceFilter,
  LocationSort,
} from "../../../../utils/locationDiscovery";
import {
  DropdownOption,
  GameDropdown,
} from "../../../common/game/GameDropdown";
import { ScaleTap } from "../../../common/ScaleTap";
import { LOCATION_COLORS, LOCATION_ON_SVG } from "../locationsTheme";
import { useLocationConsent } from "./LocationConsentModal";

const VIEW_OPTIONS: DropdownOption<LocationViewMode>[] = [
  { id: "list", label: "List", icon: "view-list" },
  { id: "map", label: "Map", icon: "map" },
];

const TYPE_OPTIONS: DropdownOption<string>[] = LOCATION_CATEGORY_FILTERS.map(
  (item) => ({
    id: item.id,
    label: item.id === "All" ? "All types" : item.label,
  }),
);

const DISTANCE_OPTIONS: DropdownOption<DistanceFilter>[] = [
  { id: "any", label: "Any distance" },
  { id: "under2", label: "Under 2 km" },
  { id: "2to10", label: "2-10 km" },
  { id: "10to30", label: "10-30 km" },
  { id: "30to50", label: "30-50 km" },
  { id: "over50", label: "Over 50 km" },
];

const SORT_OPTIONS: DropdownOption<LocationSort>[] = [
  { id: "alphabetical", label: "Name" },
  { id: "distance", label: "Nearest first" },
];

export function LocationFilterBar() {
  const viewMode = useLocationsStore((state) => state.viewMode);
  const setViewMode = useLocationsStore((state) => state.setViewMode);
  const categoryFilter = useLocationsStore((state) => state.categoryFilter);
  const setCategoryFilter = useLocationsStore(
    (state) => state.setCategoryFilter,
  );
  const distanceFilter = useLocationsStore((state) => state.distanceFilter);
  const setDistanceFilter = useLocationsStore(
    (state) => state.setDistanceFilter,
  );
  const sortBy = useLocationsStore((state) => state.sortBy);
  const setSortBy = useLocationsStore((state) => state.setSortBy);
  const hasDistances = useLocationsStore(
    (state) => state.distanceStatus === "available",
  );
  // The map needs the live position (it runs while the app is open, once shared).
  const isLive = useLocationsStore((state) => state.livePosition !== null);
  const locating = useLocationsStore(
    (state) => state.distanceStatus === "loading",
  );

  // Choice waiting for the location to be shared.
  const pendingRef = useRef<(() => void) | null>(null);
  const { ask, modal } = useLocationConsent(() => {
    pendingRef.current?.();
    pendingRef.current = null;
  });
  const withLocation = (apply: () => void, ready = hasDistances) => {
    if (ready) {
      apply();
      return;
    }
    pendingRef.current = apply;
    ask();
  };

  return (
    <>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.scroll}
        contentContainerStyle={styles.row}
      >
        {isLive ? null : (
          <ScaleTap
            label="Share my location to see distances and the map"
            style={styles.share}
            onPress={() => withLocation(() => setSortBy("distance"), false)}
            disabled={locating}
          >
            {locating ? (
              <ActivityIndicator size="small" color={LOCATION_COLORS.ink} />
            ) : (
              <SvgXml xml={LOCATION_ON_SVG} width={16} height={16} />
            )}
            <Text style={styles.shareText}>Share location</Text>
          </ScaleTap>
        )}
        <GameDropdown
          label="View"
          options={VIEW_OPTIONS}
          value={viewMode}
          onSelect={(id) =>
            id === "list"
              ? setViewMode(id)
              : withLocation(() => setViewMode(id), isLive)
          }
        />
        <GameDropdown
          label="Type of place"
          options={TYPE_OPTIONS}
          value={categoryFilter}
          onSelect={setCategoryFilter}
          icon="park"
        />
        <GameDropdown
          label="Distance"
          options={DISTANCE_OPTIONS}
          value={distanceFilter}
          onSelect={(id) =>
            id === "any"
              ? setDistanceFilter(id)
              : withLocation(() => setDistanceFilter(id))
          }
          icon="straighten"
        />
        <GameDropdown
          label="Sort by"
          options={SORT_OPTIONS}
          value={sortBy}
          icon="sort"
          onSelect={(id) =>
            id === "alphabetical"
              ? setSortBy(id)
              : withLocation(() => setSortBy(id))
          }
        />
      </ScrollView>
      {modal}
    </>
  );
}

const styles = StyleSheet.create({
  scroll: { flexGrow: 0 },
  row: { gap: 8, paddingHorizontal: 16, paddingTop: 2, paddingBottom: 10 },
  share: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    height: 40,
    paddingHorizontal: 12,
    backgroundColor: LOCATION_COLORS.pinSelectedBg,
    borderWidth: 2,
    borderBottomWidth: 5,
    borderColor: LOCATION_COLORS.ink,
    borderRadius: 999,
  },
  shareText: { fontFamily: FONTS.display, fontSize: 14, color: "#4A2A05" },
});
