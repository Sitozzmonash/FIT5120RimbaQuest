import React, { useEffect, useRef, useState } from "react";
import {
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { FONTS } from "../../../../constants/fonts";
import { useLocationsStore } from "../../../../store/useLocationsStore";
import { LocationItem } from "../../../../types";
import { HOME_MAP_IMAGES } from "../../../../constants/images";
import { WoodModal } from "../../../common/game/WoodModal";
import { LOCATION_COLORS } from "../locationsTheme";
import { CampCard } from "./CampCard";
import { useLocationConsent } from "./LocationConsentModal";
import { LocationMapHandle, LocationMapView } from "./LocationMapView";
import { MAP_CARD_WIDTH, MapPlaceCard } from "./MapPlaceCard";

const CARD_GAP = 12;
// Selection id for the "Your Camp" card; never a real location id.
const CAMP_ID = "__camp__";
const SNAP = MAP_CARD_WIDTH + CARD_GAP;
// Gap between the cards and the bottom of the screen.
const CAROUSEL_BOTTOM = 20;
// Estimated card row height until the real (text-dependent) height is measured.
const CAROUSEL_ESTIMATE = 130;

export function ExploreMap({
  locations,
  onOpen,
  topInset = 0,
}: {
  locations: LocationItem[];
  onOpen: (location: LocationItem) => void;
  topInset?: number;
}) {
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();
  const endPadding = Math.max(16, screenWidth - MAP_CARD_WIDTH - 16);
  const distances = useLocationsStore((state) => state.distances);
  const distanceStatus = useLocationsStore((state) => state.distanceStatus);
  const distanceNotice = useLocationsStore((state) => state.distanceNotice);

  const [selectedId, setSelectedId] = useState<string | null>(CAMP_ID);
  const userPosition = useLocationsStore((state) => state.livePosition);
  const [carouselHeight, setCarouselHeight] = useState(CAROUSEL_ESTIMATE);
  const bottomBand = carouselHeight + CAROUSEL_BOTTOM;
  const [pendingOpen, setPendingOpen] = useState<LocationItem | null>(null);
  const listRef = useRef<FlatList<LocationItem>>(null);
  const mapRef = useRef<LocationMapHandle>(null);

  // Keep the selection valid when the search or category filter changes.
  useEffect(() => {
    setSelectedId((current) =>
      current === CAMP_ID ||
      (current && locations.some((item) => item.id === current))
        ? current
        : CAMP_ID,
    );
  }, [locations]);

  // Card 0 is the camp card, so place cards sit one slot to the right.
  const scrollToId = (id: string) => {
    const index =
      id === CAMP_ID ? -1 : locations.findIndex((item) => item.id === id);
    if (id === CAMP_ID || index >= 0)
      listRef.current?.scrollToOffset({
        offset: (index + 1) * SNAP,
        animated: true,
      });
  };

  const selectFromMap = (id: string) => {
    setSelectedId(id);
    scrollToId(id);
  };

  const selectSlot = (slot: number) => {
    if (slot <= 0) {
      if (selectedId !== CAMP_ID) goToCamp();
      return;
    }
    const item = locations[Math.min(slot - 1, locations.length - 1)];
    if (item) setSelectedId(item.id);
  };

  const handleSwipeEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) =>
    selectSlot(Math.round(event.nativeEvent.contentOffset.x / SNAP));

  // Web has no snapToInterval or momentum events: once scrolling settles,
  // glide to the nearest card and select it.
  const settleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (settleTimer.current) clearTimeout(settleTimer.current);
    },
    [],
  );

  const handleWebScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const x = event.nativeEvent.contentOffset.x;
    if (settleTimer.current) clearTimeout(settleTimer.current);
    settleTimer.current = setTimeout(() => {
      const slot = Math.round(x / SNAP);
      if (Math.abs(slot * SNAP - x) > 1) {
        listRef.current?.scrollToOffset({
          offset: slot * SNAP,
          animated: true,
        });
      }
      selectSlot(slot);
    }, 120);
  };

  // Puts the camp tent at the device position, zooms to it and refreshes the
  // cards' distances. The position is only used on this device.
  const { ask: locateMe, modal: consentModal } = useLocationConsent(
    (position) => {
      setSelectedId(CAMP_ID);
      scrollToId(CAMP_ID);
      mapRef.current?.showUser(position.latitude, position.longitude);
    },
  );

  // Camp card / swipe back: return to the camp if it is set up.
  const goToCamp = () => {
    setSelectedId(CAMP_ID);
    if (userPosition)
      mapRef.current?.showUser(userPosition.latitude, userPosition.longitude);
  };

  return (
    <View style={styles.root}>
      <LocationMapView
        ref={mapRef}
        locations={locations}
        selectedId={selectedId}
        onSelectMarker={selectFromMap}
        userPosition={userPosition}
        topInset={topInset}
        bottomInset={bottomBand + insets.bottom}
      />

      {distanceNotice ? (
        <Text style={[styles.notice, { top: topInset + 8 }]}>
          {distanceNotice}
        </Text>
      ) : null}

      <FlatList
        ref={listRef}
        horizontal
        data={locations}
        keyExtractor={(item) => item.id}
        showsHorizontalScrollIndicator={false}
        snapToInterval={SNAP}
        decelerationRate="fast"
        onMomentumScrollEnd={handleSwipeEnd}
        onScroll={Platform.OS === "web" ? handleWebScroll : undefined}
        scrollEventThrottle={16}
        getItemLayout={(_, index) => ({
          length: SNAP,
          offset: SNAP * (index + 1),
          index,
        })}
        ListHeaderComponent={
          <View style={{ marginRight: CARD_GAP }}>
            <CampCard
              located={userPosition !== null}
              loading={distanceStatus === "loading"}
              onPress={() => {
                scrollToId(CAMP_ID);
                if (userPosition) goToCamp();
                else locateMe();
              }}
            />
          </View>
        }
        style={[styles.carousel, { bottom: CAROUSEL_BOTTOM + insets.bottom }]}
        onLayout={(event) => setCarouselHeight(event.nativeEvent.layout.height)}
        contentContainerStyle={[
          styles.carouselContent,
          { paddingRight: endPadding },
        ]}
        ItemSeparatorComponent={() => <View style={{ width: CARD_GAP }} />}
        renderItem={({ item }) => (
          <MapPlaceCard
            location={item}
            distanceKm={distances[item.id]}
            onPress={() => {
              selectFromMap(item.id);
              setPendingOpen(item);
            }}
          />
        )}
      />

      {consentModal}
      <WoodModal
        visible={pendingOpen !== null}
        onRequestClose={() => setPendingOpen(null)}
        icon={HOME_MAP_IMAGES.iconDiscover}
        positive
        stars={false}
        title="View this place?"
        message={`We'll open the location details for ${pendingOpen?.name ?? "this place"}.`}
        actionLabel="View Details"
        onAction={() => {
          const target = pendingOpen;
          setPendingOpen(null);
          if (target) onOpen(target);
        }}
        secondaryLabel="Not Now"
        onSecondary={() => setPendingOpen(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, overflow: "hidden" },
  notice: {
    position: "absolute",
    left: 16,
    right: 16,
    padding: 10,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: LOCATION_COLORS.ink,
    backgroundColor: LOCATION_COLORS.paper,
    color: LOCATION_COLORS.heading,
    fontFamily: FONTS.bodyBold,
    fontSize: 12,
    lineHeight: 17,
  },
  carousel: { position: "absolute", left: 0, right: 0, flexGrow: 0 },
  carouselContent: { paddingHorizontal: 16, paddingBottom: 6 },
});
