import React, { useMemo } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { LocationItem } from "../../../types";
import { locationMatchesCategory, locationMatchesQuery } from "../../../constants/seed";
import { useLocationsStore } from "../../../store/useLocationsStore";
import { useNavigationStore } from "../../../store/useNavigationStore";
import { Tap } from "../../common/Tap";
import { PrimaryButton } from "../../common/PrimaryButton";
import { styles as globalStyles } from "../../../styles/theme";
import { LocationsListHero } from "./components/LocationsListHero";
import { LocationCard } from "./components/LocationCard";

export function LocationsScreen() {
  const locations = useLocationsStore((state) => state.locations);
  const search = useLocationsStore((state) => state.search);
  const categoryFilter = useLocationsStore((state) => state.categoryFilter);
  const loading = useLocationsStore((state) => state.loading);
  const error = useLocationsStore((state) => state.error);
  const loadLocations = useLocationsStore((state) => state.loadLocations);
  const loadLocationDetail = useLocationsStore((state) => state.loadLocationDetail);

  const hasLocations = locations.length > 0;

  const filteredLocations = useMemo(() => {
    const query = search.trim().toLowerCase();
    return locations.filter((loc) => {
      const matchesQuery = locationMatchesQuery(loc, query);
      return matchesQuery && locationMatchesCategory(loc, categoryFilter);
    });
  }, [locations, search, categoryFilter]);

  const emptyMessage = search.trim()
    ? 'We could not find a place with that name.'
    : categoryFilter !== 'All'
      ? 'We could not find a place for this animal group.'
      : null;

  const handleSelectLocation = (loc: LocationItem) => {
    void loadLocationDetail(loc);
    useNavigationStore.getState().open("location_detail");
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#FFFFFF" }}>
      <LocationsListHero
        title="Wildlife Locations"
        onBack={() => useNavigationStore.getState().goBack()}
      />
      <View style={styles.listContainer}>
        {loading ? (
          <View style={styles.centerState}>
            <ActivityIndicator color="#0BA84A" />
            <Text style={styles.centerStateSubtitle}>
              Finding places to see animals...
            </Text>
          </View>
        ) : !hasLocations ? (
          <View style={styles.centerState}>
            <Text style={styles.centerStateTitle}>
              {error ||
                "We couldn't load wildlife locations right now. Please try again."}
            </Text>
            <PrimaryButton label="Try Again" icon="refresh" onPress={() => void loadLocations()} />
          </View>
        ) : !filteredLocations.length ? (
          <View style={styles.centerState}>
            <Text style={styles.centerStateTitle}>{emptyMessage}</Text>
          </View>
        ) : (
          <ScrollView contentContainerStyle={globalStyles.content}>
            {error ? (
              <View style={styles.noticeBanner}>
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
            <View style={styles.locationList}>
              {filteredLocations.map((loc) => (
                <LocationCard
                  key={loc.id}
                  location={loc}
                  onPress={() => handleSelectLocation(loc)}
                />
              ))}
            </View>
          </ScrollView>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  listContainer: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    marginTop: -16,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  locationList: { gap: 12 },
  noticeBanner: { marginBottom: 10 },
  centerState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    gap: 14,
  },
  centerStateTitle: {
    color: "#707872",
    fontSize: 13,
    textAlign: "center",
  },
  centerStateSubtitle: {
    color: "#707872",
    fontSize: 13,
    textAlign: "center",
  },
});
