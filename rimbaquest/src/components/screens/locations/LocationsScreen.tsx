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
import { LocationMapView } from "./components/LocationMapView";
import { LOCATION_COLORS } from "./locationsTheme";
import { formatDistance, sortLocations } from "../../../utils/locationDiscovery";

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
  const viewMode = useLocationsStore((state) => state.viewMode);
  const setViewMode = useLocationsStore((state) => state.setViewMode);
  const distances = useLocationsStore((state) => state.distances);
  const distanceStatus = useLocationsStore((state) => state.distanceStatus);
  const distanceNotice = useLocationsStore((state) => state.distanceNotice);
  const offlineNotice = useLocationsStore((state) => state.offlineNotice);
  const requestDistances = useLocationsStore((state) => state.requestDistances);
  const loadLocations = useLocationsStore((state) => state.loadLocations);
  const loadLocationDetail = useLocationsStore(
    (state) => state.loadLocationDetail,
  );

  const filteredLocations = useMemo(() => {
    const query = search.trim().toLowerCase();
    const matching = locations.filter(
      (loc) =>
        locationMatchesQuery(loc, query) &&
        locationMatchesCategory(loc, categoryFilter),
    );
    return sortLocations(matching, distances);
  }, [locations, search, categoryFilter, distances]);

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
        {offlineNotice ? <Text style={styles.notice}>{offlineNotice}</Text> : null}
        <View style={styles.tools}>
          <View style={styles.viewSwitch}>
            {(['list', 'map'] as const).map((mode) => {
              const active = viewMode === mode;
              return (
                <Tap
                  key={mode}
                  label={`Show ${mode} view`}
                  style={[styles.viewButton, active && styles.viewButtonActive]}
                  onPress={() => setViewMode(mode)}
                >
                  <Text style={[styles.viewButtonText, active && styles.viewButtonTextActive]}>
                    {mode === 'list' ? 'List View' : 'Map View'}
                  </Text>
                </Tap>
              );
            })}
          </View>
          <Tap
            label="Show distances from my location"
            style={styles.distanceButton}
            onPress={() => void requestDistances()}
            disabled={distanceStatus === 'loading'}
          >
            <Text style={styles.distanceButtonText}>
              {distanceStatus === 'loading' ? 'Finding distances...' : distanceStatus === 'available' ? 'Distances updated' : 'Show distances'}
            </Text>
          </Tap>
        </View>
        {distanceNotice ? <Text style={styles.notice}>{distanceNotice}</Text> : null}
        <PlacesSectionHeader count={filteredLocations.length} />
        {filteredLocations.length && viewMode === 'map' ? (
          <LocationMapView locations={filteredLocations} distances={distances} onSelect={handleSelectLocation} />
        ) : filteredLocations.length ? (
          filteredLocations.map((loc) => (
            <PlaceCard
              key={loc.id}
              location={loc}
              distanceLabel={formatDistance(distances[loc.id])}
              onPress={() => handleSelectLocation(loc)}
            />
          ))
        ) : (
          <PlacesStatus
            message="No matching locations found. Try another search or category."
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
  notice: { color: '#4C5D50', fontSize: 12, lineHeight: 17, backgroundColor: '#EDF6ED', borderRadius: 10, padding: 10 },
  tools: { gap: 8 },
  viewSwitch: { flexDirection: 'row', gap: 8 },
  viewButton: { flex: 1, alignItems: 'center', borderRadius: 10, borderWidth: 1, borderColor: '#B8CAB6', paddingVertical: 9, backgroundColor: '#FFFFFF' },
  viewButtonActive: { backgroundColor: LOCATION_COLORS.forest, borderColor: LOCATION_COLORS.forest },
  viewButtonText: { color: LOCATION_COLORS.ink, fontWeight: '800', fontSize: 13 },
  viewButtonTextActive: { color: '#FFFFFF' },
  distanceButton: { alignItems: 'center', borderRadius: 10, borderWidth: 1, borderColor: '#7EA884', paddingVertical: 9, backgroundColor: '#E9F5EA' },
  distanceButtonText: { color: '#1B5E32', fontWeight: '800', fontSize: 13 },
});
