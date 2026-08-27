import React, { useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LocationItem } from "../../types";
import { WILDLIFE_FILTERS } from "../../constants/seed";
import { Tap } from "../common/Tap";
import { Info } from "../common/CommonUI";
import { styles } from "../../styles/theme";

function LocationsListHero({
  title,
  onBack,
  search,
  setSearch,
  categoryFilter,
  setCategoryFilter,
}: {
  title: string;
  onBack: () => void;
  search: string;
  setSearch: (s: string) => void;
  categoryFilter: string;
  setCategoryFilter: (c: string) => void;
}) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[listHeroStyles.wrap, { paddingTop: insets.top + 8 }]}>
      <View style={listHeroStyles.bar}>
        <Tap label="Go back" style={listHeroStyles.backBtn} onPress={onBack}>
          <MaterialIcons name="chevron-left" size={20} color="#FFFFFF" />
        </Tap>
        <Text style={listHeroStyles.title} numberOfLines={1}>
          {title}
        </Text>
      </View>

      <Text style={listHeroStyles.disclaimerText}>
        Species listed here were previously observed around these KL / Klang
        Valley places. Sightings are never guaranteed — please watch from a safe
        distance.
      </Text>

      <View style={[styles.searchBox, listHeroStyles.searchBox]}>
        <Text style={styles.searchIcon}>⌕</Text>
        <TextInput
          placeholder="Search locations or areas"
          placeholderTextColor="#879089"
          value={search}
          onChangeText={setSearch}
          autoCapitalize="none"
          style={styles.searchInput}
        />
        {search.length > 0 && (
          <Tap
            label="Clear"
            style={styles.searchClear}
            onPress={() => setSearch("")}
          >
            <Text style={styles.searchClearText}>×</Text>
          </Tap>
        )}
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={listHeroStyles.chips}
      >
        {WILDLIFE_FILTERS.map((item) => {
          const active = categoryFilter === item.id;
          return (
            <Tap
              key={item.id}
              label={`Filter ${item.label}`}
              style={[listHeroStyles.chip, active && listHeroStyles.chipActive]}
              onPress={() => setCategoryFilter(item.id)}
            >
              <Text
                style={[
                  listHeroStyles.chipText,
                  active && listHeroStyles.chipTextActive,
                ]}
              >
                {item.label}
              </Text>
            </Tap>
          );
        })}
      </ScrollView>
    </View>
  );
}

const listHeroStyles = StyleSheet.create({
  wrap: { backgroundColor: "#0A4D26" },
  bar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    height: 56,
    paddingHorizontal: 20,
  },
  backBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.6)",
    alignItems: "center",
    justifyContent: "center",
  },
  title: { color: "#FFFFFF", fontSize: 22, fontWeight: "900", flexShrink: 1 },
  disclaimerText: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 12,
    lineHeight: 17,
    fontWeight: "500",
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  searchBox: { marginHorizontal: 20, marginBottom: 16 },
  chips: { gap: 8, paddingHorizontal: 20, paddingBottom: 20, marginBottom: 10 },
  chip: {
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.15)",
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  chipActive: { backgroundColor: "#FFFFFF" },
  chipText: {
    fontSize: 11,
    color: "rgba(255,255,255,0.85)",
    fontWeight: "700",
  },
  chipTextActive: { color: "#0A4D26" },
});

function LocationDetailHeader({
  title,
  onBack,
}: {
  title: string;
  onBack: () => void;
}) {
  const insets = useSafeAreaInsets();
  return (
    <View
      style={[locationDetailHeaderStyles.wrap, { paddingTop: insets.top + 8 }]}
    >
      <Tap
        label="Go back"
        style={locationDetailHeaderStyles.backBtn}
        onPress={onBack}
      >
        <MaterialIcons name="chevron-left" size={20} color="#1B211C" />
      </Tap>
      <Text style={locationDetailHeaderStyles.title} numberOfLines={1}>
        {title}
      </Text>
    </View>
  );
}

const locationDetailHeaderStyles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    minHeight: 56,
    paddingHorizontal: 20,
    backgroundColor: "#FFFFFF",
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#E2ECE4",
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  title: { color: "#1B211C", fontSize: 22, fontWeight: "900", flexShrink: 1 },
});

export function LocationsScreen({
  locations,
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
      <ScrollView
        style={{
          flex: 1,
          backgroundColor: "#FFFFFF",
          marginTop: -16,
          borderTopLeftRadius: 16,
          borderTopRightRadius: 16,
        }}
        contentContainerStyle={styles.content}
      >
        {loading ? (
          <View style={styles.searchEmpty}>
            <ActivityIndicator color="#0BA84A" />
            <Text style={[styles.muted, { marginTop: 10 }]}>
              Loading wildlife locations...
            </Text>
          </View>
        ) : error && !locations.length ? (
          <View style={styles.searchEmpty}>
            <Text style={styles.searchEmptyTitle}>{error}</Text>
            <Tap label="Try Again" style={styles.primary} onPress={onRetry}>
              <Text style={styles.primaryText}>Try Again</Text>
            </Tap>
          </View>
        ) : (
          <>
            {error ? (
              <View style={styles.noticeBanner}>
                <Text style={styles.notice}>{error}</Text>
                <Tap
                  label="Try Again"
                  style={styles.textButton}
                  onPress={onRetry}
                >
                  <Text style={styles.textButtonText}>Try Again</Text>
                </Tap>
              </View>
            ) : null}
            {locations.length ? (
              <View style={styles.locationList}>
                {locations.map((loc) => (
                  <Tap
                    key={loc.id}
                    label={`View ${loc.name}`}
                    style={styles.locationCard}
                    onPress={() => onSelectLocation(loc)}
                  >
                    <View style={styles.locationTopRow}>
                      <Text style={styles.locationName}>{loc.name}</Text>
                    </View>
                    <Text style={styles.locationArea}>📍 {loc.area}</Text>
                    <Text style={styles.locationDesc} numberOfLines={2}>
                      {loc.description}
                    </Text>
                    {loc.typical_wildlife ? (
                      <View style={styles.wildlifeTagRow}>
                        <Text style={styles.wildlifeTagLabel}>
                          Previously observed here:
                        </Text>
                        <Text style={styles.wildlifeTagValue}>
                          {loc.typical_wildlife}
                        </Text>
                      </View>
                    ) : null}
                    <View style={styles.locationCardBottom}>
                      {loc.best_time ? (
                        <Text style={styles.bestTimeText}>
                          Best time: {loc.best_time}
                        </Text>
                      ) : (
                        <View />
                      )}
                      <Text style={styles.viewDetailText}>View Details ›</Text>
                    </View>
                  </Tap>
                ))}
              </View>
            ) : (
              <View style={styles.searchEmpty}>
                <Text style={styles.searchEmptyTitle}>
                  {emptyMessage || "No matching locations found."}
                </Text>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

export function LocationDetailScreen({
  location,
  error,
  onRetry,
  onBack,
  onRecordHere,
}: {
  location: LocationItem;
  error: string | null;
  onRetry: () => void;
  onBack: () => void;
  onRecordHere: (name: string) => void;
}) {
  return (
    <View style={{ flex: 1, backgroundColor: "#FFFFFF" }}>
      <LocationDetailHeader title="Location Detail" onBack={onBack} />
      <ScrollView contentContainerStyle={styles.content}>
        {error ? (
          <View style={styles.searchEmpty}>
            <Text style={styles.searchEmptyTitle}>{error}</Text>
            <Tap label="Try Again" style={styles.primary} onPress={onRetry}>
              <Text style={styles.primaryText}>Try Again</Text>
            </Tap>
            <Tap label="Back" style={styles.secondary} onPress={onBack}>
              <Text style={styles.secondaryText}>Back</Text>
            </Tap>
          </View>
        ) : null}
        {!error || location.description ? (
          <>
            <Text style={styles.pageTitle}>{location.name}</Text>

            <View style={styles.locationDetailHero}>
              {location.area ? (
                <Text style={styles.locationAreaHero}>{location.area}</Text>
              ) : null}
              {location.type ? (
                <Text style={styles.locationTypeBadge}>{location.type}</Text>
              ) : null}
            </View>

            {location.description ? (
              <Info label="ABOUT THIS LOCATION" value={location.description} />
            ) : null}
            {location.why_recommended ? (
              <Info
                label="WILDLIFE / NATURE CONTEXT"
                value={location.why_recommended}
              />
            ) : null}
            {location.best_time ? (
              <Info label="BEST TIME TO VISIT" value={location.best_time} />
            ) : null}
            {location.typical_wildlife ? (
              <Info
                label="WILDLIFE YOU MAY ENCOUNTER"
                value={`${location.typical_wildlife}\nThese species were previously observed here — sightings are not guaranteed.`}
              />
            ) : null}

            {location.facilities && location.facilities.length > 0 && (
              <View style={styles.info}>
                <Text style={styles.infoLabel}>PARK FACILITIES</Text>
                <View style={styles.badges}>
                  {location.facilities.map((fac) => (
                    <Text key={fac} style={styles.badge}>
                      ✓ {fac}
                    </Text>
                  ))}
                </View>
              </View>
            )}

            <Tap
              label="Record Discovery Here"
              style={styles.primary}
              onPress={() => onRecordHere(location.name)}
            >
              <Text style={styles.primaryText}>
                Record Wildlife Sighting Here
              </Text>
            </Tap>
          </>
        ) : null}
      </ScrollView>
    </View>
  );
}
