import React from 'react';
import { ScrollView, Text, TextInput, View } from 'react-native';
import { LocationItem } from '../../types';
import { CATEGORIES } from '../../constants/seed';
import { Tap } from '../common/Tap';
import { Header, Info } from '../common/CommonUI';
import { styles } from '../../styles/theme';

export function LocationsScreen({
  locations,
  search,
  setSearch,
  categoryFilter,
  setCategoryFilter,
  onSelectLocation,
}: {
  locations: LocationItem[];
  search: string;
  setSearch: (s: string) => void;
  categoryFilter: string;
  setCategoryFilter: (c: string) => void;
  onSelectLocation: (loc: LocationItem) => void;
}) {
  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Header title="Wildlife Locations" back={false} />

      <View style={styles.disclaimerBox}>
        <Text style={styles.disclaimerTitle}>🌿 Nature Explorer Safety Note</Text>
        <Text style={styles.disclaimerText}>
          Wildlife encounters depend on nature and cannot be guaranteed. Always observe from a safe distance and stay on designated park trails.
        </Text>
      </View>

      <View style={styles.searchBox}>
        <Text style={styles.searchIcon}>⌕</Text>
        <TextInput
          placeholder="Search places by name or area (e.g. Gasing, FRIM)..."
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
        {['All', ...CATEGORIES].map((item) => (
          <Tap
            key={item}
            label={`Filter ${item}`}
            style={[styles.chip, categoryFilter === item && styles.chipActive]}
            onPress={() => setCategoryFilter(item)}
          >
            <Text style={[styles.chipText, categoryFilter === item && styles.chipTextActive]}>
              {item === 'All' ? 'All Wildlife' : `${item}s`}
            </Text>
          </Tap>
        ))}
      </ScrollView>

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
                <Text style={styles.distanceBadge}>{loc.distance_km} km</Text>
              </View>
              <Text style={styles.locationArea}>📍 {loc.area}</Text>
              <Text style={styles.locationDesc} numberOfLines={2}>{loc.description}</Text>
              {loc.typical_wildlife && (
                <View style={styles.wildlifeTagRow}>
                  <Text style={styles.wildlifeTagLabel}>Typical Wildlife:</Text>
                  <Text style={styles.wildlifeTagValue}>{loc.typical_wildlife}</Text>
                </View>
              )}
              <View style={styles.locationCardBottom}>
                <Text style={styles.bestTimeText}>⏰ Best Time: {loc.best_time}</Text>
                <Text style={styles.viewDetailText}>View Details ›</Text>
              </View>
            </Tap>
          ))}
        </View>
      ) : (
        <View style={styles.searchEmpty}>
          <Text style={styles.searchEmptyTitle}>No matching locations found</Text>
          <Text style={styles.muted}>Try clearing your search or choosing a different wildlife category.</Text>
        </View>
      )}
    </ScrollView>
  );
}

export function LocationDetailScreen({
  location,
  onBack,
  onRecordHere,
}: {
  location: LocationItem;
  onBack: () => void;
  onRecordHere: (name: string) => void;
}) {
  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Header title={location.name} onBack={onBack} />
      <View style={styles.locationDetailHero}>
        <Text style={styles.locationAreaHero}>📍 {location.area}</Text>
        <Text style={styles.locationTypeBadge}>{location.type}</Text>
      </View>

      <Info label="ABOUT THIS LOCATION" value={location.description} />
      <Info label="BEST TIME TO VISIT" value={location.best_time} />
      <Info label="WHY EXPLORE HERE" value={location.why_recommended} />
      {location.typical_wildlife && <Info label="TYPICAL WILDLIFE SIGHTINGS" value={location.typical_wildlife} />}

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
    </ScrollView>
  );
}
