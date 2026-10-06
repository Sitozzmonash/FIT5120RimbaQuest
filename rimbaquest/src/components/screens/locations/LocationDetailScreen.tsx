import React, { useState } from "react";
import { Linking, ScrollView, StyleSheet, Text, View } from "react-native";
import { useDiscoveryStore } from "../../../store/useDiscoveryStore";
import { useLocationsStore } from "../../../store/useLocationsStore";
import { useNavigationStore } from "../../../store/useNavigationStore";
import { Tap } from "../../common/Tap";
import { PrimaryButton } from "../../common/PrimaryButton";
import { Info } from "../../common/CommonUI";
import { styles as globalStyles } from "../../../styles/theme";
import { LocationDetailHeader } from "./components/LocationDetailHeader";
import { LocationFacilities } from "./components/LocationFacilities";
import { directionsUrl, formatDistance } from '../../../utils/locationDiscovery';

export function LocationDetailScreen() {
  const location = useLocationsStore((state) => state.selectedLocation);
  const error = useLocationsStore((state) => state.detailError);
  const loadLocationDetail = useLocationsStore(
    (state) => state.loadLocationDetail,
  );
  const distance = useLocationsStore((state) => state.distances[location?.id ?? '']);
  const [navigationError, setNavigationError] = useState<string | null>(null);

  if (!location) return null;

  const goBack = () => useNavigationStore.getState().goBack();
  const openDirections = async () => {
    const url = directionsUrl(location);
    try {
      if (!(await Linking.canOpenURL(url))) throw new Error('unsupported');
      await Linking.openURL(url);
      setNavigationError(null);
    } catch {
      setNavigationError("We couldn't open Google Maps right now. Please try again later.");
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#FFFFFF" }}>
      <LocationDetailHeader onBack={goBack} />
      <ScrollView contentContainerStyle={globalStyles.content}>
        {error ? (
          <View style={globalStyles.searchEmpty}>
            <Text style={globalStyles.searchEmptyTitle}>{error}</Text>
            <PrimaryButton
              label="Try Again"
              onPress={() => void loadLocationDetail(location)}
            />
            <Tap label="Back" style={globalStyles.secondary} onPress={goBack}>
              <Text style={globalStyles.secondaryText}>Back</Text>
            </Tap>
          </View>
        ) : null}

        {!error || location.description ? (
          <>
            <Text style={globalStyles.pageTitle}>{location.name}</Text>

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
                label="WHY THIS PLACE IS FUN"
                value={location.why_recommended}
              />
            ) : null}

            {location.best_time ? (
              <Info label="BEST TIME TO VISIT" value={location.best_time} />
            ) : null}

            {formatDistance(distance) ? (
              <Info label="APPROXIMATE DISTANCE" value={formatDistance(distance) as string} />
            ) : null}

            {typeof location.rating === 'number' ? (
              <Info
                label="RATING"
                value={`${location.rating.toFixed(1)}${location.review_count ? ` from ${location.review_count} reviews` : ''}`}
              />
            ) : null}

            {location.typical_wildlife ? (
              <Info
                label="ANIMALS YOU MAY SEE"
                value={`${location.typical_wildlife}\nPeople have seen these animals here before, but you may not see them today.`}
              />
            ) : null}

            {location.facilities && location.facilities.length > 0 && (
              <LocationFacilities facilities={location.facilities} />
            )}

            {location.responsible_exploration ? (
              <Info label="EXPLORE RESPONSIBLY" value={location.responsible_exploration} />
            ) : null}

            {location.official_website ? (
              <Tap
                label={`Open ${location.name} official website`}
                style={styles.linkButton}
                onPress={() => void Linking.openURL(location.official_website as string)}
              >
                <Text style={styles.linkButtonText}>Visit official website</Text>
              </Tap>
            ) : null}

            <PrimaryButton label="Get Directions" style={styles.directionsBtn} onPress={() => void openDirections()} />
            {navigationError ? <Text style={styles.navigationError}>{navigationError}</Text> : null}

            <PrimaryButton
              label="Take an Animal Photo Here"
              style={styles.recordBtn}
              onPress={() => useDiscoveryStore.getState().start(location.name)}
            />
          </>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  recordBtn: { marginTop: 8 },
  directionsBtn: { marginTop: 14 },
  navigationError: { color: '#9A3412', textAlign: 'center', fontSize: 12, marginTop: 8 },
  linkButton: { alignItems: 'center', borderRadius: 12, borderWidth: 1, borderColor: '#1B6A42', padding: 12, marginTop: 14 },
  linkButtonText: { color: '#1B6A42', fontWeight: '800' },
  locationDetailHero: {
    backgroundColor: "#F4FAF6",
    padding: 16,
    borderRadius: 16,
    marginTop: 14,
    marginBottom: 12,
    alignItems: "center",
  },
  locationAreaHero: { fontSize: 14, fontWeight: "800", color: "#1B211C" },
  locationTypeBadge: {
    fontSize: 11,
    color: "#0BA84A",
    fontWeight: "700",
    marginTop: 4,
  },
});
