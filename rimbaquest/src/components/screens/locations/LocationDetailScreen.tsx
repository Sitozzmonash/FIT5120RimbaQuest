import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useDiscoveryStore } from "../../../store/useDiscoveryStore";
import { useLocationsStore } from "../../../store/useLocationsStore";
import { useNavigationStore } from "../../../store/useNavigationStore";
import { Tap } from "../../common/Tap";
import { PrimaryButton } from "../../common/PrimaryButton";
import { Info } from "../../common/CommonUI";
import { styles as globalStyles } from "../../../styles/theme";
import { LocationDetailHeader } from "./components/LocationDetailHeader";
import { LocationFacilities } from "./components/LocationFacilities";

export function LocationDetailScreen() {
  const location = useLocationsStore((state) => state.selectedLocation);
  const error = useLocationsStore((state) => state.detailError);
  const loadLocationDetail = useLocationsStore(
    (state) => state.loadLocationDetail,
  );

  if (!location) return null;

  const goBack = () => useNavigationStore.getState().goBack();

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

            {location.typical_wildlife ? (
              <Info
                label="ANIMALS YOU MAY SEE"
                value={`${location.typical_wildlife}\nPeople have seen these animals here before, but you may not see them today.`}
              />
            ) : null}

            {location.facilities && location.facilities.length > 0 && (
              <LocationFacilities facilities={location.facilities} />
            )}

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
