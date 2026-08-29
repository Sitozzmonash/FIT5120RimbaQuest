import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { LocationItem } from "../../../types";
import { Tap } from "../../common/Tap";
import { PrimaryButton } from "../../common/PrimaryButton";
import { Info } from "../../common/CommonUI";
import { styles as globalStyles } from "../../../styles/theme";
import { LocationDetailHeader } from "./components/LocationDetailHeader";
import { LocationFacilities } from "./components/LocationFacilities";

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
      <ScrollView contentContainerStyle={globalStyles.content}>
        {error ? (
          <View style={globalStyles.searchEmpty}>
            <Text style={globalStyles.searchEmptyTitle}>{error}</Text>
            <PrimaryButton label="Try Again" onPress={onRetry} />
            <Tap label="Back" style={globalStyles.secondary} onPress={onBack}>
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
              <LocationFacilities facilities={location.facilities} />
            )}

            <PrimaryButton
              label="Record Wildlife Sighting Here"
              style={styles.recordBtn}
              onPress={() => onRecordHere(location.name)}
            />
          </>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  recordBtn: { marginTop: 14 },
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
