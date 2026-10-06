import React, { useMemo } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LocationItem } from "../../../types";
import {
  LOCATION_CATEGORY_FILTERS,
  locationMatchesCategory,
  locationMatchesQuery,
} from "../../../constants/seed";
import { useLocationsStore } from "../../../store/useLocationsStore";
import { useNavigationStore } from "../../../store/useNavigationStore";
import { styles as globalStyles } from "../../../styles/theme";
import { Tap } from "../../common/Tap";
import { GameScreenHeader } from "../../common/game/GameScreenHeader";
import { LocationSearchBar } from "./components/LocationSearchBar";
import { PlaceCard } from "./components/PlaceCard";
import { PlacesSectionHeader } from "./components/PlacesSectionHeader";
import { PlacesStatus } from "./components/PlacesStatus";
import { SightingsWarningBanner } from "./components/SightingsWarningBanner";
import { LOCATION_COLORS } from "./locationsTheme";

export function LocationsScreen() {
  const insets = useSafeAreaInsets();
  const locations = useLocationsStore((state) => state.locations);
  const search = useLocationsStore((state) => state.search);
  const categoryFilter = useLocationsStore((state) => state.categoryFilter);
  const setCategoryFilter = useLocationsStore(
    (state) => state.setCategoryFilter,
  );
  const loading = useLocationsStore((state) => state.loading);
  const error = useLocationsStore((state) => state.error);
  const loadLocations = useLocationsStore((state) => state.loadLocations);
  const loadLocationDetail = useLocationsStore(
    (state) => state.loadLocationDetail,
  );

  const filteredLocations = useMemo(() => {
    const query = search.trim().toLowerCase();
    return locations.filter(
      (loc) =>
        locationMatchesQuery(loc, query) &&
        locationMatchesCategory(loc, categoryFilter),
    );
  }, [locations, search, categoryFilter]);

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
        <PlacesSectionHeader count={filteredLocations.length} />
        {filteredLocations.length ? (
          filteredLocations.map((loc) => (
            <PlaceCard
              key={loc.id}
              location={loc}
              onPress={() => handleSelectLocation(loc)}
            />
          ))
        ) : (
          <PlacesStatus
            message={
              search.trim()
                ? "We could not find a place with that name."
                : "No places in this category yet."
            }
          />
        )}
      </ScrollView>
    );
  };

  return (
    <View style={styles.root}>
      <GameScreenHeader
        title="Wildlife Locations"
        onBack={() => useNavigationStore.getState().goBack()}
      />
      <SightingsWarningBanner />
      <LocationSearchBar />
      <View style={styles.chipsWrap}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chips}
        >
          {LOCATION_CATEGORY_FILTERS.map((item) => {
            const active = categoryFilter === item.id;
            return (
              <Tap
                key={item.id}
                label={`Filter ${item.label}`}
                style={[styles.chip, active && styles.chipActive]}
                onPress={() => setCategoryFilter(item.id)}
              >
                <Text
                  style={[styles.chipText, active && styles.chipTextActive]}
                >
                  {item.label}
                </Text>
              </Tap>
            );
          })}
        </ScrollView>
      </View>
      <View style={styles.panel}>{renderPlaces()}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, gap: 8, backgroundColor: LOCATION_COLORS.forest },
  chipsWrap: { paddingHorizontal: 16 },
  chips: { gap: 8, paddingVertical: 6 },
  chip: {
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.16)",
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  chipActive: { backgroundColor: LOCATION_COLORS.paper },
  chipText: {
    fontSize: 12,
    color: "rgba(255,255,255,0.9)",
    fontWeight: "700",
  },
  chipTextActive: { color: LOCATION_COLORS.ink },
  panel: {
    flex: 1,
    overflow: "hidden",
    backgroundColor: LOCATION_COLORS.panel,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  list: { gap: 16, paddingTop: 14, paddingHorizontal: 16 },
});
