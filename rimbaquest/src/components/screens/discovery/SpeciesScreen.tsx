import React, { useState } from "react";
import {
  LayoutChangeEvent,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { Species } from "../../../types";
import { imageFor } from "../../../constants/images";
import { Tap } from "../../common/Tap";
import { DiscoveryHeader } from "./components/DiscoveryHeader";
import { DiscoveryStepIndicator } from "./components/DiscoveryStepIndicator";
import { DiscoveryBottomNav } from "./components/DiscoveryBottomNav";
import { PhotoPreview } from "./components/PhotoPreview";
import { SelectableTile } from "./components/SelectableTile";

// Step 3: pick the species. Selection is provisional (checkmark on the
// tile) until Next is pressed, mirroring the Category step. The search bar
// scrolls with the rest of the content until it reaches the app header, at
// which point it sticks in place and the species grid scrolls underneath it.
export function SpeciesScreen({
  photo,
  category,
  speciesList,
  search,
  setSearch,
  selectedId,
  onChooseSpecies,
  onBack,
  onDiscard,
}: {
  photo: { uri: string };
  category: string;
  speciesList: Species[];
  search: string;
  setSearch: (s: string) => void;
  selectedId?: string | null;
  onChooseSpecies: (item: Species) => void;
  onBack: () => void;
  onDiscard: () => void;
}) {
  const [pending, setPending] = useState<Species | null>(
    () => speciesList.find((item) => item.id === selectedId) ?? null
  );
  const [searchTop, setSearchTop] = useState(0);
  const [stuck, setStuck] = useState(false);

  const rows: Species[][] = [];
  for (let i = 0; i < speciesList.length; i += 3)
    rows.push(speciesList.slice(i, i + 3));

  const handleSearchLayout = (e: LayoutChangeEvent) => {
    setSearchTop((current) => current || e.nativeEvent.layout.y);
  };

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (!searchTop) return;
    const next = e.nativeEvent.contentOffset.y >= searchTop;
    setStuck((prev) => (prev === next ? prev : next));
  };

  const searchBar = (
    <View style={styles.searchBox}>
      <MaterialIcons name="search" size={20} color="#879089" />
      <TextInput
        placeholder="Search species..."
        placeholderTextColor="#879089"
        value={search}
        onChangeText={setSearch}
        autoCapitalize="none"
        style={styles.searchInput}
      />
      {search.length > 0 && (
        <Tap
          label="Clear search"
          style={styles.clearBtn}
          onPress={() => setSearch("")}
        >
          <MaterialIcons name="close" size={16} color="#087B35" />
        </Tap>
      )}
    </View>
  );

  return (
    <View style={styles.page}>
      <DiscoveryHeader
        title="Record a Discovery"
        onBack={onBack}
        confirmDiscard
        onDiscard={onDiscard}
      />

      <View style={styles.scrollArea}>
        <ScrollView
          contentContainerStyle={styles.content}
          onScroll={handleScroll}
          scrollEventThrottle={16}
        >
          <DiscoveryStepIndicator step={3} />

          <View style={styles.intro}>
            <Text style={styles.title}>
              Which {category.toLowerCase()} did you see?
            </Text>
            <Text style={styles.subtitle}>
              Select the species that looks most like what you saw
            </Text>
          </View>

          <PhotoPreview photo={photo} />

          <View onLayout={handleSearchLayout}>{searchBar}</View>

          {speciesList.length ? (
            <View style={styles.grid}>
              {rows.map((row, i) => (
                <View key={`row-${i}`} style={styles.row}>
                  {row.map((item) => (
                    <SelectableTile
                      key={item.id}
                      image={imageFor(item)!}
                      label={item.common_name}
                      selected={pending?.id === item.id}
                      onPress={() => setPending(item)}
                    />
                  ))}
                  {Array.from({ length: 3 - row.length }).map((_, j) => (
                    <View key={`spacer-${i}-${j}`} style={styles.spacer} />
                  ))}
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>No matching species found.</Text>
              <Text style={styles.emptyText}>
                Try a different name, or clear the search to see all{" "}
                {category.toLowerCase()}s.
              </Text>
            </View>
          )}
        </ScrollView>

        {stuck && <View style={styles.searchSticky}>{searchBar}</View>}
      </View>

      <DiscoveryBottomNav
        onBack={onBack}
        nextLabel="Next"
        nextDisabled={!pending}
        onNext={() => pending && onChooseSpecies(pending)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: "#FFFFFF" },
  scrollArea: { flex: 1, position: "relative" },
  content: { padding: 16, gap: 16 },
  intro: { gap: 6 },
  title: { color: "#1A1A1A", fontSize: 24, lineHeight: 30, fontWeight: "900" },
  subtitle: {
    color: "#1A1A1A",
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "500",
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    height: 44,
    borderWidth: 1,
    borderColor: "#CCCCCC",
    borderRadius: 24,
    paddingHorizontal: 12,
    backgroundColor: "#FFFFFF",
  },
  searchInput: { flex: 1, color: "#1A1A1A", fontSize: 15, paddingVertical: 0 },
  clearBtn: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#EDF5EF",
    alignItems: "center",
    justifyContent: "center",
  },
  searchSticky: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  grid: { gap: 12, width: "100%" },
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    width: "100%",
  },
  spacer: { flex: 1, opacity: 0 },
  empty: {
    borderWidth: 1,
    borderColor: "#CBECD6",
    backgroundColor: "#F4FFF7",
    borderRadius: 14,
    padding: 18,
    alignItems: "center",
  },
  emptyTitle: {
    color: "#087B35",
    fontSize: 15,
    fontWeight: "800",
    marginBottom: 4,
  },
  emptyText: { color: "#707872", fontSize: 12, textAlign: "center" },
});
