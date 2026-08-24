import React from 'react';
import { ActivityIndicator, ScrollView, Text, TextInput, View } from 'react-native';
import { LocationItem } from '../../types';
import { WILDLIFE_FILTERS } from '../../constants/seed';
import { Tap } from '../common/Tap';
import { Header, Info } from '../common/CommonUI';
import { styles } from '../../styles/theme';

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
}) {
  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Header title="Wildlife Locations" back={false} />

      <View style={styles.disclaimerBox}>
        <Text style={styles.disclaimerTitle}>Wildlife you may encounter</Text>
        <Text style={styles.disclaimerText}>
          Species listed here were previously observed around these KL / Klang Valley places. Sightings are never guaranteed — please watch from a safe distance.
        </Text>
      </View>

      <View style={styles.searchBox}>
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
          <Tap label="Clear" style={styles.searchClear} onPress={() => setSearch('')}>
            <Text style={styles.searchClearText}>×</Text>
          </Tap>
        )}
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
        {WILDLIFE_FILTERS.map((item) => (
          <Tap
            key={item.id}
            label={`Filter ${item.label}`}
            style={[styles.chip, categoryFilter === item.id && styles.chipActive]}
            onPress={() => setCategoryFilter(item.id)}
          >
            <Text style={[styles.chipText, categoryFilter === item.id && styles.chipTextActive]}>
              {item.label}
            </Text>
          </Tap>
        ))}
      </ScrollView>

      {loading ? (
        <View style={styles.searchEmpty}>
          <ActivityIndicator color="#0BA84A" />
          <Text style={[styles.muted, { marginTop: 10 }]}>Loading wildlife locations...</Text>
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
              <Tap label="Try Again" style={styles.textButton} onPress={onRetry}>
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
                  <Text style={styles.locationDesc} numberOfLines={2}>{loc.description}</Text>
                  {loc.typical_wildlife ? (
                    <View style={styles.wildlifeTagRow}>
                      <Text style={styles.wildlifeTagLabel}>Previously observed here:</Text>
                      <Text style={styles.wildlifeTagValue}>{loc.typical_wildlife}</Text>
                    </View>
                  ) : null}
                  <View style={styles.locationCardBottom}>
                    {loc.best_time ? <Text style={styles.bestTimeText}>Best time: {loc.best_time}</Text> : <View />}
                    <Text style={styles.viewDetailText}>View Details ›</Text>
                  </View>
                </Tap>
              ))}
            </View>
          ) : (
            <View style={styles.searchEmpty}>
              <Text style={styles.searchEmptyTitle}>{emptyMessage || 'No matching locations found.'}</Text>
            </View>
          )}
        </>
      )}
    </ScrollView>
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
    <ScrollView contentContainerStyle={styles.content}>
      <Header title={location.name} onBack={onBack} />
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
          <View style={styles.locationDetailHero}>
            {location.area ? <Text style={styles.locationAreaHero}>📍 {location.area}</Text> : null}
            {location.type ? <Text style={styles.locationTypeBadge}>{location.type}</Text> : null}
          </View>

          {location.description ? <Info label="ABOUT THIS LOCATION" value={location.description} /> : null}
          {location.why_recommended ? <Info label="WILDLIFE / NATURE CONTEXT" value={location.why_recommended} /> : null}
          {location.best_time ? <Info label="BEST TIME TO VISIT" value={location.best_time} /> : null}
          {location.typical_wildlife ? (
            <Info label="WILDLIFE YOU MAY ENCOUNTER" value={`${location.typical_wildlife}\nThese species were previously observed here — sightings are not guaranteed.`} />
          ) : null}

          {location.facilities && location.facilities.length > 0 && (
            <View style={styles.info}>
              <Text style={styles.infoLabel}>PARK FACILITIES</Text>
              <View style={styles.badges}>
                {location.facilities.map((fac) => (
                  <Text key={fac} style={styles.badge}>✓ {fac}</Text>
                ))}
              </View>
            </View>
          )}

          <Tap
            label="Record Discovery Here"
            style={styles.primary}
            onPress={() => onRecordHere(location.name)}
          >
            <Text style={styles.primaryText}>📷 Record Wildlife Sighting Here</Text>
          </Tap>
        </>
      ) : null}
    </ScrollView>
  );
}
