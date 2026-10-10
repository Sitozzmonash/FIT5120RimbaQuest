import React, { useEffect, useMemo, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LocationItem } from "../../../types";
import {
  locationMatchesCategory,
  locationMatchesQuery,
} from "../../../constants/seed";
import { useLocationsStore } from "../../../store/useLocationsStore";
import { useNavigationStore } from "../../../store/useNavigationStore";
import { styles as globalStyles } from "../../../styles/theme";
import { Tap } from "../../common/Tap";
// import { FilterChips } from "../../common/game/FilterChips"; // replaced by LocationFilterBar
import { GameScreenHeader } from "../../common/game/GameScreenHeader";
import { LocationFilterBar } from "./components/LocationFilterBar";
import { LocationSearchBar } from "./components/LocationSearchBar";
import { PlaceCard } from "./components/PlaceCard";
import { PlacesSectionHeader } from "./components/PlacesSectionHeader";
import { PlacesStatus } from "./components/PlacesStatus";
import { ExploreMap } from "./components/ExploreMap";
import { LOCATION_COLORS } from "./locationsTheme";
import {
  formatDistanceAway,
  locationMatchesDistance,
  orderLocations,
} from "../../../utils/locationDiscovery";

export function LocationsScreen() {
  const insets = useSafeAreaInsets();
  const locations = useLocationsStore((state) => state.locations);
  const search = useLocationsStore((state) => state.search);
  const categoryFilter = useLocationsStore((state) => state.categoryFilter);
  const distanceFilter = useLocationsStore((state) => state.distanceFilter);
  const sortBy = useLocationsStore((state) => state.sortBy);
  const loading = useLocationsStore((state) => state.loading);
  const error = useLocationsStore((state) => state.error);
  const viewMode = useLocationsStore((state) => state.viewMode);
  const distances = useLocationsStore((state) => state.distances);
  const offlineNotice = useLocationsStore((state) => state.offlineNotice);
  const loadLocations = useLocationsStore((state) => state.loadLocations);
  const loadLocationDetail = useLocationsStore(
    (state) => state.loadLocationDetail,
  );

  const [topBarHeight, setTopBarHeight] = useState(220);

  // restart location quietly on coming back
  // (updates stop while the explorer is elsewhere in the app).
  useEffect(() => {
    void useLocationsStore.getState().resumeLocationUpdates();
  }, []);

  // The map is only shown while the location is shared. Coming back with Map
  // selected keeps it while location resumes; otherwise it falls back to List.
  const isLive = useLocationsStore((state) => state.livePosition !== null);
  const sessionConsent = useLocationsStore((state) => state.sessionConsent);
  useEffect(() => {
    if (viewMode === "map" && !isLive && !sessionConsent) {
      useLocationsStore.getState().setViewMode("list");
    }
  }, [viewMode, isLive, sessionConsent]);

  const filteredLocations = useMemo(() => {
    const query = search.trim().toLowerCase();
    const matching = locations.filter(
      (loc) =>
        locationMatchesQuery(loc, query) &&
        locationMatchesCategory(loc, categoryFilter) &&
        locationMatchesDistance(distances[loc.id], distanceFilter),
    );
    return orderLocations(matching, distances, sortBy);
  }, [locations, search, categoryFilter, distanceFilter, sortBy, distances]);

  const handleSelectLocation = (loc: LocationItem) => {
    void loadLocationDetail(loc);
    useNavigationStore.getState().open("location_detail");
  };

  const renderPlaces = () => {
    if (loading) {
      return (
        <PlacesStatus loading message="Finding places to see animals..." />
      );
    }
    if (!locations.length) {
      return (
        <PlacesStatus
          message={
            error ||
            "We couldn't load wildlife locations right now. Please try again."
          }
          onRetry={() => void loadLocations()}
        />
      );
    }
    return (
      <ScrollView
        contentContainerStyle={[
          styles.list,
          { paddingBottom: 24 + insets.bottom },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        {error ? (
          <View>
            <Text style={globalStyles.notice}>{error}</Text>
            <Tap
              label="Try Again"
              style={globalStyles.textButton}
              onPress={() => void loadLocations()}
            >
              <Text style={globalStyles.textButtonText}>Try Again</Text>
            </Tap>
          </View>
        ) : null}
        {offlineNotice ? (
          <Text style={styles.notice}>{offlineNotice}</Text>
        ) : null}
        <PlacesSectionHeader count={filteredLocations.length} />
        {filteredLocations.length ? (
          filteredLocations.map((loc) => (
            <PlaceCard
              key={loc.id}
              location={loc}
              distanceLabel={formatDistanceAway(distances[loc.id])}
              onPress={() => handleSelectLocation(loc)}
            />
          ))
        ) : (
          <PlacesStatus message="No matching locations found. Try another search or filter." />
        )}
      </ScrollView>
    );
  };

  const topBar = (
    <>
      <GameScreenHeader
        title="Wildlife Locations"
        guide="discover"
        onBack={() => useNavigationStore.getState().goBack()}
      />
      <LocationSearchBar />
      <LocationFilterBar />
    </>
  );

  // Shown even when nothing matches: the map stays, with only the camp card.
  const showMap = viewMode === "map" && !loading && locations.length > 0;

  if (showMap) {
    return (
      <View style={[styles.root, styles.mapRoot]}>
        <View style={StyleSheet.absoluteFill}>
          <ExploreMap
            locations={filteredLocations}
            onOpen={handleSelectLocation}
            topInset={topBarHeight}
          />
        </View>
        <View
          style={styles.mapOverlay}
          pointerEvents="box-none"
          onLayout={(event) => setTopBarHeight(event.nativeEvent.layout.height)}
        >
          {topBar}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      {topBar}
      <View style={styles.panel}>{renderPlaces()}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, gap: 8, backgroundColor: LOCATION_COLORS.forest },
  mapRoot: { backgroundColor: "#F2F2F0" },
  mapOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    gap: 8,
    zIndex: 10,
  },
  panel: {
    flex: 1,
    overflow: "hidden",
    backgroundColor: LOCATION_COLORS.panel,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  list: { gap: 16, paddingTop: 14, paddingHorizontal: 16 },
  notice: {
    color: "#4C5D50",
    fontSize: 12,
    lineHeight: 17,
    backgroundColor: "#EDF6ED",
    borderRadius: 10,
    padding: 10,
  },
});
