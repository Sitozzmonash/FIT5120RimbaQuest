import React, { useState } from "react";
import {
  Image,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SvgXml } from "react-native-svg";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { FONTS } from "../../../constants/fonts";
import { useLocationsStore } from "../../../store/useLocationsStore";
import { useNavigationStore } from "../../../store/useNavigationStore";
import { Tap } from "../../common/Tap";
import { GameButton } from "../../common/game/GameButton";
import { GameScreenHeader } from "../../common/game/GameScreenHeader";
import { WoodCard } from "../../common/game/WoodCard";
import { WoodPlank } from "../../common/game/WoodPlank";
import {
  DetailSection,
  DetailText,
  SectionDashes,
} from "./components/DetailSection";
import { LeaveAppModal, LeaveTarget } from "./components/LeaveAppModal";
import { LocationFacilities } from "./components/LocationFacilities";
import { LOCATION_COLORS, STAR_OUTLINE_SVG } from "./locationsTheme";
import {
  directionsUrl,
  formatDistance,
} from "../../../utils/locationDiscovery";

const STARS = [0, 1, 2, 3, 4];

export function LocationDetailScreen() {
  const insets = useSafeAreaInsets();
  const location = useLocationsStore((state) => state.selectedLocation);
  const error = useLocationsStore((state) => state.detailError);
  const loadLocationDetail = useLocationsStore(
    (state) => state.loadLocationDetail,
  );
  const distance = useLocationsStore(
    (state) => state.distances[location?.id ?? ""],
  );
  const [navigationError, setNavigationError] = useState<string | null>(null);
  const [leaveTarget, setLeaveTarget] = useState<LeaveTarget | null>(null);

  if (!location) return null;

  const goBack = () => useNavigationStore.getState().goBack();
  const openDirections = async () => {
    const url = directionsUrl(location);
    try {
      if (!(await Linking.canOpenURL(url))) throw new Error("unsupported");
      await Linking.openURL(url);
      setNavigationError(null);
    } catch {
      setNavigationError(
        "We couldn't open Google Maps right now. Please try again later.",
      );
    }
  };
  const confirmLeave = () => {
    const target = leaveTarget;
    setLeaveTarget(null);
    if (target === "maps") void openDirections();
    else if (target === "website" && location.official_website) {
      void Linking.openURL(location.official_website);
    }
  };

  const distanceLabel = formatDistance(distance);

  // Only sections with data are shown; each gets a dashed rule except the first.
  const sections: { title: string; content: React.ReactNode }[] = [
    ...(location.area
      ? [
          {
            title: "Address",
            content: <DetailText>{location.area}</DetailText>,
          },
        ]
      : []),
    ...(location.type
      ? [{ title: "Type", content: <DetailText>{location.type}</DetailText> }]
      : []),
    ...(distanceLabel
      ? [
          {
            title: "Straight-line distance",
            content: <DetailText>{distanceLabel}</DetailText>,
          },
        ]
      : []),
    ...(location.description
      ? [
          {
            title: "About this place",
            content: <DetailText>{location.description}</DetailText>,
          },
        ]
      : []),
    ...(location.why_recommended
      ? [
          {
            title: "Why it's fun",
            content: <DetailText>{location.why_recommended}</DetailText>,
          },
        ]
      : []),
    ...(location.best_time
      ? [
          {
            title: "Opening hours",
            content: <DetailText>{location.best_time}</DetailText>,
          },
        ]
      : []),
    ...(typeof location.rating === "number"
      ? [
          {
            title: "Overall rating",
            content: (
              <View style={styles.rating}>
                {STARS.map((index) => (
                  <SvgXml
                    key={index}
                    xml={STAR_OUTLINE_SVG}
                    width={17}
                    height={17}
                  />
                ))}
                <Text style={styles.ratingText}>
                  {location.rating.toFixed(1)}
                  {location.review_count
                    ? ` (${location.review_count} reviews)`
                    : ""}
                </Text>
              </View>
            ),
          },
        ]
      : []),
    ...(location.facilities?.length
      ? [
          {
            title: "Facilities",
            content: <LocationFacilities facilities={location.facilities} />,
          },
        ]
      : []),
    ...(location.official_website
      ? [
          {
            title: "Official website",
            content: (
              <Tap
                label={`Open ${location.name} official website`}
                onPress={() => setLeaveTarget("website")}
              >
                <DetailText underline>{location.official_website}</DetailText>
              </Tap>
            ),
          },
        ]
      : []),
    ...(location.responsible_exploration
      ? [
          {
            title: "Responsible exploration",
            content: (
              <DetailText>{location.responsible_exploration}</DetailText>
            ),
          },
        ]
      : []),
  ];

  return (
    <View style={styles.root}>
      <GameScreenHeader title="Wildlife Locations" onBack={goBack} />
      <ScrollView
        style={styles.contentArea}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: 24 + insets.bottom },
        ]}
      >
        {error ? (
          <WoodCard title="Oops!">
            <DetailText>{error}</DetailText>
            <GameButton
              label="Try Again"
              onPress={() => void loadLocationDetail(location)}
            />
            <GameButton label="Back" variant="secondary" onPress={goBack} />
          </WoodCard>
        ) : null}

        {!error || location.description ? (
          <View style={styles.card}>
            <WoodPlank title={location.name} large />
            <View style={styles.cardBody}>
              {location.image_url ? (
                <View style={styles.polaroid}>
                  <View style={styles.photoFrame}>
                    <Image
                      source={{ uri: location.image_url }}
                      style={styles.photo}
                      resizeMode="cover"
                    />
                  </View>
                </View>
              ) : null}

              {sections.map((section, index) => (
                <DetailSection
                  key={section.title}
                  title={section.title}
                  divider={index > 0}
                >
                  {section.content}
                </DetailSection>
              ))}

              <SectionDashes />
              <GameButton
                label="Open in Google Maps"
                onPress={() => setLeaveTarget("maps")}
                style={styles.directions}
              />
              {navigationError ? (
                <Text style={styles.navigationError}>{navigationError}</Text>
              ) : null}
            </View>
          </View>
        ) : null}
      </ScrollView>

      <LeaveAppModal
        target={leaveTarget}
        onConfirm={confirmLeave}
        onCancel={() => setLeaveTarget(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: LOCATION_COLORS.forest },
  contentArea: { flex: 1, backgroundColor: LOCATION_COLORS.panel },
  content: { gap: 16, padding: 16 },
  card: {
    backgroundColor: LOCATION_COLORS.paper,
    borderWidth: 3,
    borderBottomWidth: 9,
    borderColor: LOCATION_COLORS.ink,
    borderRadius: 24,
    overflow: "hidden",
  },
  cardBody: { alignItems: "center", gap: 12, padding: 16 },
  polaroid: {
    alignSelf: "stretch",
    padding: 8.67,
    backgroundColor: LOCATION_COLORS.photoMat,
    borderWidth: 3.25,
    borderBottomWidth: 8.67,
    borderColor: LOCATION_COLORS.ink,
    borderRadius: 15.17,
  },
  photoFrame: {
    height: 152,
    padding: 0,
    backgroundColor: LOCATION_COLORS.photoBg,
    borderWidth: 2.17,
    borderColor: LOCATION_COLORS.ink,
    borderRadius: 8.67,
    overflow: "hidden",
  },
  photo: { flex: 1, width: "100%", borderRadius: 6.5 },
  rating: { flexDirection: "row", alignItems: "center", gap: 4 },
  ratingText: {
    fontFamily: FONTS.bodyExtraBold,
    fontSize: 13,
    color: LOCATION_COLORS.brownText,
  },
  directions: { alignSelf: "stretch", marginTop: 8 },
  navigationError: {
    color: "#9A3412",
    textAlign: "center",
    fontSize: 12,
    fontFamily: FONTS.bodyBold,
  },
});
