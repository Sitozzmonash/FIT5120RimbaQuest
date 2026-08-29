import React from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { LocationItem } from "../../../types";
import { Tap } from "../../common/Tap";
import { PrimaryButton } from "../../common/PrimaryButton";
import { styles as globalStyles } from "../../../styles/theme";
import { LocationsListHero } from "./components/LocationsListHero";
import { LocationCard } from "./components/LocationCard";

export function LocationsScreen({
  locations,
  hasLocations,
  search,
  setSearch,
  categoryFilter,
  setCategoryFilter,
  loading,
  error,
  emptyMessage,
  onRetry,
  onSelectLocation,
  onBack,
}: {
  locations: LocationItem[];
  hasLocations: boolean;
  search: string;
  setSearch: (s: string) => void;
  categoryFilter: string;
  setCategoryFilter: (c: string) => void;
  loading: boolean;
  error: string | null;
  emptyMessage: string | null;
  onRetry: () => void;
  onSelectLocation: (loc: LocationItem) => void;
  onBack: () => void;
}) {
  return (
    <View style={{ flex: 1, backgroundColor: "#FFFFFF" }}>
      <LocationsListHero
        title="Wildlife Locations"
        onBack={onBack}
        search={search}
        setSearch={setSearch}
        categoryFilter={categoryFilter}
        setCategoryFilter={setCategoryFilter}
      />
      <View style={styles.listContainer}>
        {loading ? (
          <View style={styles.centerState}>
            <ActivityIndicator color="#0BA84A" />
            <Text style={styles.centerStateSubtitle}>
              Loading wildlife locations...
            </Text>
          </View>
        ) : !hasLocations ? (
          <View style={styles.centerState}>
            <Text style={styles.centerStateTitle}>
              {error ||
                "We couldn't load wildlife locations right now. Please try again."}
            </Text>
            <PrimaryButton label="Try Again" icon="refresh" onPress={onRetry} />
          </View>
        ) : !locations.length ? (
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
                  onPress={onRetry}
                >
                  <Text style={globalStyles.textButtonText}>Try Again</Text>
                </Tap>
              </View>
            ) : null}
            <View style={styles.locationList}>
              {locations.map((loc) => (
                <LocationCard
                  key={loc.id}
                  location={loc}
                  onPress={() => onSelectLocation(loc)}
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
